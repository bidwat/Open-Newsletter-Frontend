"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import Toast from "@/src/components/Toast";
import DraftPreview from "@/src/components/DraftPreview";
import {
  copyCampaign,
  createDraft,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  sendCampaign,
  updateDraft,
  type Campaign,
  type CampaignDraftPayload,
} from "@/src/services/campaigns";
import {
  listMailingLists,
  listContacts,
  type Contact,
  type MailingList,
} from "@/src/services/mailingLists";

type ContentMode = "text" | "html";

type FilterMode = "all" | "draft" | "ready" | "sent";

const emptyForm = {
  name: "",
  mailingListIds: [] as string[],
  subject: "",
  content: "",
  mode: "text" as ContentMode,
  excludedContactIds: [] as string[],
};

export default function CampaignsWorkspace() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [mailingLists, setMailingLists] = useState<MailingList[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [detailForm, setDetailForm] = useState(emptyForm);
  const [campaignStatus, setCampaignStatus] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [detailContactOptions, setDetailContactOptions] = useState<Contact[]>(
    [],
  );
  const [createContactOptions, setCreateContactOptions] = useState<Contact[]>(
    [],
  );

  const getSelectedValues = (event: ChangeEvent<HTMLSelectElement>) =>
    Array.from(event.target.selectedOptions).map((option) => option.value);

  const loadContactOptions = async (
    listIds: string[],
    setter: Dispatch<SetStateAction<Contact[]>>,
  ) => {
    if (listIds.length === 0) {
      setter([]);
      return;
    }

    const results = await Promise.all(
      listIds.map((listId) => listContacts(listId)),
    );
    const combined = results
      .map((result) => result.data || [])
      .flat()
      .reduce<Contact[]>((acc, contact) => {
        if (!acc.some((entry) => entry.id === contact.id)) {
          acc.push(contact);
        }
        return acc;
      }, []);
    setter(combined);
  };

  const loadCampaigns = async () => {
    setLoading(true);
    const result = await listCampaigns();
    if (result.error) {
      setStatusMessage(result.error);
      setLoading(false);
      return;
    }

    const data = result.data || [];
    setCampaigns(data);
    setLoading(false);

    if (!selectedId && data.length > 0) {
      setSelectedId(data[0].id);
    }
  };

  const loadMailingLists = async () => {
    const result = await listMailingLists();
    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setMailingLists(result.data || []);
  };

  const loadDetails = async (campaignId: number | null) => {
    if (!campaignId) {
      setDetailForm(emptyForm);
      setCampaignStatus(null);
      return;
    }

    setDetailLoading(true);
    const result = await getCampaign(campaignId);
    if (result.error) {
      setStatusMessage(result.error);
      setDetailLoading(false);
      return;
    }

    if (result.data) {
      const mode: ContentMode = result.data.htmlContent ? "html" : "text";
      const mailingListIds =
        result.data.mailingLists?.map((list) => String(list.id)) ??
        (result.data.mailingListId ? [String(result.data.mailingListId)] : []);
      setDetailForm({
        name: result.data.name || "",
        mailingListIds,
        subject: result.data.subject || "",
        content: result.data.htmlContent || result.data.textContent || "",
        mode,
        excludedContactIds: (result.data.excludedContactIds || []).map((id) =>
          String(id),
        ),
      });
      setCampaignStatus(result.data.status || "DRAFT");
    }

    setDetailLoading(false);
  };

  useEffect(() => {
    void loadCampaigns();
    void loadMailingLists();
  }, []);

  useEffect(() => {
    void loadDetails(selectedId);
  }, [selectedId]);

  useEffect(() => {
    void loadContactOptions(detailForm.mailingListIds, setDetailContactOptions);
  }, [detailForm.mailingListIds]);

  useEffect(() => {
    void loadContactOptions(createForm.mailingListIds, setCreateContactOptions);
  }, [createForm.mailingListIds]);

  const filteredCampaigns = useMemo(() => {
    const normalized = filter.toUpperCase();
    if (filter === "all") {
      return campaigns;
    }

    return campaigns.filter(
      (campaign) => (campaign.status || "DRAFT") === normalized,
    );
  }, [campaigns, filter]);

  useEffect(() => {
    if (filteredCampaigns.length === 0) {
      setSelectedId(null);
      return;
    }

    const hasSelection = filteredCampaigns.some(
      (campaign) => campaign.id === selectedId,
    );
    if (!hasSelection) {
      setSelectedId(filteredCampaigns[0].id);
    }
  }, [filteredCampaigns, selectedId]);

  const handleCreate = async () => {
    const listIds = createForm.mailingListIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
    if (!createForm.name.trim() || listIds.length === 0) {
      setStatusMessage("Name and at least one mailing list are required.");
      return;
    }

    if (listIds.length === 0) {
      setStatusMessage("Select at least one valid mailing list.");
      return;
    }

    const payload: CampaignDraftPayload = {
      name: createForm.name.trim(),
      mailingListIds: listIds,
      subject: createForm.subject.trim() || undefined,
      htmlContent:
        createForm.mode === "html"
          ? createForm.content.trim() || undefined
          : undefined,
      textContent:
        createForm.mode === "text"
          ? createForm.content.trim() || undefined
          : undefined,
      excludedContactIds: createForm.excludedContactIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id)),
    };

    const result = await createDraft(payload);
    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setToastMessage("Campaign draft created.");
    setCreateForm(emptyForm);
    setShowCreateModal(false);
    await loadCampaigns();
    if (result.data?.id) {
      setSelectedId(result.data.id);
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) {
      setStatusMessage("Select a campaign to update.");
      return;
    }

    const payload: Partial<CampaignDraftPayload> = {
      name: detailForm.name.trim() || undefined,
      mailingListIds:
        detailForm.mailingListIds.length > 0
          ? detailForm.mailingListIds
              .map((id) => Number(id))
              .filter((id) => Number.isFinite(id))
          : undefined,
      subject: detailForm.subject.trim() || undefined,
      htmlContent:
        detailForm.mode === "html"
          ? detailForm.content.trim() || undefined
          : undefined,
      textContent:
        detailForm.mode === "text"
          ? detailForm.content.trim() || undefined
          : undefined,
      excludedContactIds: detailForm.excludedContactIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id)),
    };

    const result = await updateDraft(selectedId, payload);
    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setToastMessage("Campaign updated.");
    await loadCampaigns();
    await loadDetails(selectedId);
  };

  const handleSend = async () => {
    if (!selectedId) {
      setStatusMessage("Select a campaign to send.");
      return;
    }

    const result = await sendCampaign(selectedId);
    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setToastMessage("Campaign send initiated.");
    await loadCampaigns();
    await loadDetails(selectedId);
  };

  const handleCopy = async () => {
    if (!selectedId) {
      setStatusMessage("Select a campaign to copy.");
      return;
    }

    const result = await copyCampaign(selectedId);
    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setToastMessage("Campaign copy created.");
    await loadCampaigns();
    if (result.data?.id) {
      setSelectedId(result.data.id);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      setStatusMessage("Select a campaign to delete.");
      return;
    }

    const confirmed = window.confirm(
      "Delete this campaign? This cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    const result = await deleteCampaign(selectedId);
    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setToastMessage("Campaign deleted.");
    setSelectedId(null);
    await loadCampaigns();
  };

  const isSent = campaignStatus === "SENT";
  const detailListOptions = mailingLists.map((list) => ({
    id: String(list.id),
    name: list.name,
  }));

  return (
    <div className="workspace-layout">
      <aside className="workspace-sidebar pressable">
        <div className="sidebar-header">
          <h2>Campaigns</h2>
          <p>{loading ? "Loading..." : `${campaigns.length} total`}</p>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={() => setShowCreateModal(true)}
        >
          New campaign
        </button>
        <div className="filter-row">
          {(
            [
              { label: "All", value: "all" },
              { label: "Drafts", value: "draft" },
              { label: "Ready", value: "ready" },
              { label: "Sent", value: "sent" },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              className={`filter-chip ${filter === item.value ? "active" : ""}`}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="sidebar-list">
          {filteredCampaigns.map((campaign) => (
            <button
              key={campaign.id}
              type="button"
              className={`sidebar-item ${
                selectedId === campaign.id ? "active" : ""
              }`}
              onClick={() => setSelectedId(campaign.id)}
            >
              <span>{campaign.name}</span>
              <span className="pill-small">{campaign.status || "DRAFT"}</span>
            </button>
          ))}
          {!loading && filteredCampaigns.length === 0 ? (
            <p className="muted">No campaigns in this filter.</p>
          ) : null}
        </div>
      </aside>

      <section className="workspace-detail">
        <div className="panel pressable">
          <div className="panel-header">
            <h2>Campaign details</h2>
            <p>
              {campaignStatus
                ? `Status: ${campaignStatus}`
                : "Select a campaign"}
            </p>
          </div>
          {detailLoading ? (
            <p>Loading campaign...</p>
          ) : selectedId ? (
            <>
              <div className="field-grid">
                <label className="field">
                  <span>Name</span>
                  <input
                    value={detailForm.name}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    disabled={isSent}
                  />
                </label>
                <label className="field">
                  <span>Mailing list</span>
                  <select
                    value={detailForm.mailingListIds[0] ?? ""}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        mailingListIds: event.target.value
                          ? [event.target.value]
                          : [],
                      }))
                    }
                    disabled={isSent}
                  >
                    <option value="">Select a list</option>
                    {detailListOptions.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Subject</span>
                  <input
                    value={detailForm.subject}
                    onChange={(event) =>
                      setDetailForm((current) => ({
                        ...current,
                        subject: event.target.value,
                      }))
                    }
                    disabled={isSent}
                  />
                </label>
              </div>
              <label className="field field-wide">
                <span>Exclude contacts</span>
                <select
                  value={detailForm.excludedContactIds[0] ?? ""}
                  onChange={(event) =>
                    setDetailForm((current) => ({
                      ...current,
                      excludedContactIds: event.target.value
                        ? [event.target.value]
                        : [],
                    }))
                  }
                  disabled={isSent || detailContactOptions.length === 0}
                >
                  <option value="">No exclusions</option>
                  {detailContactOptions.map((contact) => (
                    <option key={contact.id} value={String(contact.id)}>
                      {contact.email}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mode-row">
                <span className="mode-label">Content mode</span>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-button ${
                      detailForm.mode === "text" ? "active" : ""
                    }`}
                    onClick={() =>
                      setDetailForm((current) => ({
                        ...current,
                        mode: "text",
                      }))
                    }
                    disabled={isSent}
                  >
                    Text
                  </button>
                  <button
                    type="button"
                    className={`toggle-button ${
                      detailForm.mode === "html" ? "active" : ""
                    }`}
                    onClick={() =>
                      setDetailForm((current) => ({
                        ...current,
                        mode: "html",
                      }))
                    }
                    disabled={isSent}
                  >
                    HTML
                  </button>
                </div>
              </div>
              <label className="field field-wide">
                <span>
                  {detailForm.mode === "html" ? "HTML content" : "Text content"}
                </span>
                <textarea
                  rows={8}
                  value={detailForm.content}
                  onChange={(event) =>
                    setDetailForm((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                  disabled={isSent}
                />
              </label>
              <div className="row-actions">
                <button type="button" onClick={handleUpdate} disabled={isSent}>
                  Save changes
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={handleSend}
                  disabled={campaignStatus !== "READY"}
                >
                  Send campaign
                </button>
                <button type="button" onClick={handleCopy}>
                  Create copy
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={handleDelete}
                >
                  Delete campaign
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowPreview((current) => !current)}
                >
                  {showPreview ? "Hide preview" : "Show preview"}
                </button>
              </div>
              {showPreview ? (
                <DraftPreview
                  subject={detailForm.subject}
                  content={detailForm.content}
                  mode={detailForm.mode}
                />
              ) : null}
            </>
          ) : (
            <p className="muted">Select a campaign to see details.</p>
          )}
        </div>

        {statusMessage ? (
          <p className="status-message inline">{statusMessage}</p>
        ) : null}

        {showCreateModal ? (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal pressable">
              <h3>Create campaign draft</h3>
              <div className="field-grid">
                <label className="field">
                  <span>Name</span>
                  <input
                    value={createForm.name}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="October Promo"
                  />
                </label>
                <label className="field">
                  <span>Mailing list</span>
                  <select
                    value={createForm.mailingListIds[0] ?? ""}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        mailingListIds: event.target.value
                          ? [event.target.value]
                          : [],
                      }))
                    }
                  >
                    <option value="">Select a list</option>
                    {mailingLists.map((list) => (
                      <option key={list.id} value={String(list.id)}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field field-wide">
                  <span>Subject</span>
                  <input
                    value={createForm.subject}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        subject: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <label className="field field-wide">
                <span>Exclude contacts</span>
                <select
                  value={createForm.excludedContactIds[0] ?? ""}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      excludedContactIds: event.target.value
                        ? [event.target.value]
                        : [],
                    }))
                  }
                  disabled={createContactOptions.length === 0}
                >
                  <option value="">No exclusions</option>
                  {createContactOptions.map((contact) => (
                    <option key={contact.id} value={String(contact.id)}>
                      {contact.email}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mode-row">
                <span className="mode-label">Content mode</span>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-button ${
                      createForm.mode === "text" ? "active" : ""
                    }`}
                    onClick={() =>
                      setCreateForm((current) => ({
                        ...current,
                        mode: "text",
                      }))
                    }
                  >
                    Text
                  </button>
                  <button
                    type="button"
                    className={`toggle-button ${
                      createForm.mode === "html" ? "active" : ""
                    }`}
                    onClick={() =>
                      setCreateForm((current) => ({
                        ...current,
                        mode: "html",
                      }))
                    }
                  >
                    HTML
                  </button>
                </div>
              </div>
              <label className="field field-wide">
                <span>
                  {createForm.mode === "html" ? "HTML content" : "Text content"}
                </span>
                <textarea
                  rows={6}
                  value={createForm.content}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="button" onClick={handleCreate}>
                  Create draft
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
      {toastMessage ? (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      ) : null}
    </div>
  );
}
