"use client";

import { useEffect, useMemo, useState } from "react";
import Toast from "@/src/components/Toast";
import DraftPreview from "@/src/components/DraftPreview";
import {
  bulkUpdateCampaignContactExclusions,
  copyCampaign,
  createDraft,
  deleteCampaign,
  getCampaignContacts,
  getCampaign,
  listCampaigns,
  sendCampaign,
  updateDraft,
  type CampaignAudienceContact,
  type Campaign,
  type CampaignDraftPayload,
} from "@/src/services/campaigns";
import {
  listMailingLists,
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
};

type DetailTab = "details" | "audience";

interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClassName?: string;
  onConfirm: () => void | Promise<void>;
}

interface ErrorDialogState {
  title: string;
  message: string;
  actionLabel?: string;
  actionClassName?: string;
  onAction?: () => void | Promise<void>;
}

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
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("details");
  const [audienceContacts, setAudienceContacts] = useState<
    CampaignAudienceContact[]
  >([]);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audienceSelection, setAudienceSelection] = useState<number[]>([]);
  const [pendingExclusions, setPendingExclusions] = useState<
    Record<number, boolean>
  >({});
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(
    null,
  );
  const [errorDialog, setErrorDialog] = useState<ErrorDialogState | null>(null);

  const parseBackendErrorMessage = (error: string) => {
    try {
      const parsed = JSON.parse(error) as {
        message?: string;
        error?: string;
      };
      return parsed.message || parsed.error || error;
    } catch (parseError) {
      return error;
    }
  };

  const showBackendError = (
    error: string,
    options?: {
      title?: string;
      actionLabel?: string;
      actionClassName?: string;
      onAction?: () => void | Promise<void>;
    },
  ) => {
    const message = parseBackendErrorMessage(error);
    setErrorDialog({
      title: options?.title || "Something went wrong",
      message,
      actionLabel: options?.actionLabel,
      actionClassName: options?.actionClassName,
      onAction: options?.onAction,
    });
  };

  const loadCampaigns = async () => {
    setLoading(true);
    const result = await listCampaigns();
    if (result.error) {
      showBackendError(result.error, { title: "Unable to load campaigns" });
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
      showBackendError(result.error, {
        title: "Unable to load mailing lists",
      });
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
      showBackendError(result.error, { title: "Unable to load campaign" });
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
    setActiveDetailTab("details");
    setAudienceContacts([]);
    setAudienceSelection([]);
    setPendingExclusions({});
  }, [selectedId]);

  const loadAudience = async (campaignId: number) => {
    setAudienceLoading(true);
    const result = await getCampaignContacts(campaignId);
    if (result.error) {
      showBackendError(result.error, { title: "Unable to load audience" });
      setAudienceLoading(false);
      return;
    }

    setAudienceContacts(result.data || []);
    setAudienceSelection([]);
    setPendingExclusions({});
    setAudienceLoading(false);
  };

  useEffect(() => {
    if (selectedId && activeDetailTab === "audience") {
      void loadAudience(selectedId);
    }
  }, [selectedId, activeDetailTab]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const entries = Object.entries(pendingExclusions);
    if (entries.length === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const excludedIds: number[] = [];
      const includedIds: number[] = [];

      entries.forEach(([contactId, excluded]) => {
        const numericId = Number(contactId);
        if (!Number.isFinite(numericId)) {
          return;
        }

        if (excluded) {
          excludedIds.push(numericId);
        } else {
          includedIds.push(numericId);
        }
      });

      const syncUpdates = async () => {
        if (excludedIds.length > 0) {
          const result = await bulkUpdateCampaignContactExclusions(selectedId, {
            contactIds: excludedIds,
            excluded: true,
          });
          if (result.error) {
            showBackendError(result.error, {
              title: "Unable to update audience",
            });
          }
        }

        if (includedIds.length > 0) {
          const result = await bulkUpdateCampaignContactExclusions(selectedId, {
            contactIds: includedIds,
            excluded: false,
          });
          if (result.error) {
            showBackendError(result.error, {
              title: "Unable to update audience",
            });
          }
        }
      };

      void syncUpdates();
      setPendingExclusions({});
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [pendingExclusions, selectedId]);

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
    };

    const result = await createDraft(payload);
    if (result.error) {
      showBackendError(result.error, { title: "Unable to create campaign" });
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
    };

    const result = await updateDraft(selectedId, payload);
    if (result.error) {
      showBackendError(result.error, { title: "Unable to update campaign" });
      return;
    }

    setToastMessage("Campaign updated.");
    await loadCampaigns();
    await loadDetails(selectedId);
    if (activeDetailTab === "audience") {
      await loadAudience(selectedId);
    }
  };

  const handleSend = async () => {
    if (!selectedId) {
      setStatusMessage("Select a campaign to send.");
      return;
    }

    const result = await sendCampaign(selectedId);
    if (result.error) {
      showBackendError(result.error, { title: "Unable to send campaign" });
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
      showBackendError(result.error, { title: "Unable to copy campaign" });
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

    setConfirmDialog({
      title: "Delete campaign",
      message: "Delete this campaign? This cannot be undone.",
      confirmLabel: "Delete campaign",
      confirmClassName: "action-delete",
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await deleteCampaign(selectedId);
        if (result.error) {
          showBackendError(result.error, {
            title: "Unable to delete campaign",
          });
          return;
        }

        setToastMessage("Campaign deleted.");
        setSelectedId(null);
        await loadCampaigns();
      },
    });
  };

  const isSent = campaignStatus === "SENT";
  const detailListOptions = mailingLists.map((list) => ({
    id: String(list.id),
    name: list.name,
  }));

  const selectedCount = audienceSelection.length;
  const totalRecipients = audienceContacts.filter(
    (contact) => !contact.excluded,
  ).length;
  const allSelected =
    audienceContacts.length > 0 &&
    audienceSelection.length === audienceContacts.length;

  const toggleAudienceSelection = (contactId: number) => {
    setAudienceSelection((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId],
    );
  };

  const toggleAllAudienceSelection = () => {
    if (allSelected) {
      setAudienceSelection([]);
      return;
    }

    setAudienceSelection(audienceContacts.map((contact) => contact.id));
  };

  const updateContactExclusion = (contactId: number, excluded: boolean) => {
    setAudienceContacts((current) =>
      current.map((contact) =>
        contact.id === contactId ? { ...contact, excluded } : contact,
      ),
    );
    setPendingExclusions((current) => ({
      ...current,
      [contactId]: excluded,
    }));
  };

  const updateSelectedExclusions = (excluded: boolean) => {
    if (audienceSelection.length === 0) {
      return;
    }

    setAudienceContacts((current) =>
      current.map((contact) =>
        audienceSelection.includes(contact.id)
          ? { ...contact, excluded }
          : contact,
      ),
    );
    setPendingExclusions((current) => {
      const next = { ...current };
      audienceSelection.forEach((contactId) => {
        next[contactId] = excluded;
      });
      return next;
    });
    setAudienceSelection([]);
  };

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
              <div className="tab-row">
                <button
                  type="button"
                  className={`tab-button ${
                    activeDetailTab === "details" ? "active" : ""
                  }`}
                  onClick={() => setActiveDetailTab("details")}
                >
                  Details
                </button>
                <button
                  type="button"
                  className={`tab-button ${
                    activeDetailTab === "audience" ? "active" : ""
                  }`}
                  onClick={() => setActiveDetailTab("audience")}
                >
                  Review audience
                </button>
              </div>

              {activeDetailTab === "details" ? (
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
                      {detailForm.mode === "html"
                        ? "HTML content"
                        : "Text content"}
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
                    <button
                      type="button"
                      className="action-save"
                      onClick={handleUpdate}
                      disabled={isSent}
                    >
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
                      className="button secondary action-delete"
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
                <>
                  <div className="audience-summary">
                    <p>Audience recipients: {totalRecipients}</p>
                    <div className="audience-actions">
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() =>
                          selectedId ? loadAudience(selectedId) : null
                        }
                      >
                        Refresh audience
                      </button>
                      {selectedCount > 0 ? (
                        <>
                          <button
                            type="button"
                            className="action-delete"
                            onClick={() => updateSelectedExclusions(true)}
                          >
                            Exclude selected
                          </button>
                          <button
                            type="button"
                            className="action-save"
                            onClick={() => updateSelectedExclusions(false)}
                          >
                            Include selected
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {audienceLoading ? (
                    <p>Loading audience...</p>
                  ) : audienceContacts.length === 0 ? (
                    <p className="muted">No contacts in this audience.</p>
                  ) : (
                    <div className="audience-table">
                      <div className="audience-row header">
                        <span>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAllAudienceSelection}
                          />
                        </span>
                        <span>Name</span>
                        <span>Email</span>
                        <span>Source lists</span>
                        <span>Included</span>
                      </div>
                      {audienceContacts.map((contact) => {
                        const name = `${contact.firstName || ""} ${
                          contact.lastName || ""
                        }`.trim();
                        const sourceNames = contact.sourceLists?.length
                          ? contact.sourceLists
                              .map((list) => list.name)
                              .join(", ")
                          : "-";
                        return (
                          <div
                            key={contact.id}
                            className={`audience-row ${
                              contact.excluded ? "excluded" : ""
                            }`}
                          >
                            <span>
                              <input
                                type="checkbox"
                                checked={audienceSelection.includes(contact.id)}
                                onChange={() =>
                                  toggleAudienceSelection(contact.id)
                                }
                              />
                            </span>
                            <span>{name || "Unnamed"}</span>
                            <span>{contact.email}</span>
                            <span>{sourceNames}</span>
                            <span>
                              <input
                                type="checkbox"
                                checked={!contact.excluded}
                                onChange={() =>
                                  updateContactExclusion(
                                    contact.id,
                                    !contact.excluded,
                                  )
                                }
                              />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
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
                <button
                  type="button"
                  className="action-save"
                  onClick={handleCreate}
                >
                  Create draft
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {confirmDialog ? (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal pressable">
              <h3>{confirmDialog.title}</h3>
              <p>{confirmDialog.message}</p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setConfirmDialog(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={confirmDialog.confirmClassName}
                  onClick={async () => {
                    await confirmDialog.onConfirm();
                  }}
                >
                  {confirmDialog.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {errorDialog ? (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal pressable">
              <h3>{errorDialog.title}</h3>
              <p>{errorDialog.message}</p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setErrorDialog(null)}
                >
                  Close
                </button>
                {errorDialog.actionLabel && errorDialog.onAction ? (
                  <button
                    type="button"
                    className={errorDialog.actionClassName}
                    onClick={async () => {
                      await errorDialog.onAction?.();
                    }}
                  >
                    {errorDialog.actionLabel}
                  </button>
                ) : null}
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
