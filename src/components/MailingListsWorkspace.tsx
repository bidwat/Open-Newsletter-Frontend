"use client";

import { useEffect, useMemo, useState } from "react";
import Toast from "@/src/components/Toast";
import ScrollableTable, {
  type TableColumn,
} from "@/src/components/ScrollableTable";
import ImportFileActions from "@/src/components/ImportFileActions";
import Toggle from "@/src/components/Toggle";
import {
  addContact,
  copyMailingList,
  createMailingList,
  deleteMailingList,
  getMailingListWithContacts,
  importMailingList,
  importMailingListTo,
  listContacts,
  listMailingLists,
  removeContact,
  toggleMailingListHidden,
  type Contact,
  type MailingList,
  updateContact,
} from "@/src/services/mailingLists";

interface ContactCounts {
  [listId: string]: number;
}

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

type ToastTone = "success" | "warning" | "error" | "info";

export default function MailingListsWorkspace() {
  const [lists, setLists] = useState<MailingList[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedList, setSelectedList] = useState<MailingList | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [counts, setCounts] = useState<ContactCounts>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<ToastTone>("success");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showImportContactsModal, setShowImportContactsModal] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [contactForm, setContactForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importTargetFile, setImportTargetFile] = useState<File | null>(null);
  const [contactEdit, setContactEdit] = useState<Contact | null>(null);
  const [contactEditForm, setContactEditForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });
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

  const showToast = (message: string, tone: ToastTone = "success") => {
    setToastTone(tone);
    setToastMessage(message);
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

  const loadLists = async () => {
    setLoading(true);
    const result = await listMailingLists();
    if (result.error) {
      showBackendError(result.error, { title: "Unable to load lists" });
      setLoading(false);
      return;
    }

    const data = result.data || [];
    setLists(data);
    setLoading(false);

    if (!selectedId && data.length > 0) {
      setSelectedId(data[0].id);
    }

    const countEntries = await Promise.all(
      data.map(async (list) => {
        const contactResult = await listContacts(String(list.id));
        const count = contactResult.data?.length ?? 0;
        return [list.id, count] as const;
      }),
    );

    const countMap: ContactCounts = {};
    countEntries.forEach(([id, count]) => {
      countMap[id] = count;
    });
    setCounts(countMap);
  };

  const loadDetails = async (listId: number | null) => {
    if (!listId) {
      setSelectedList(null);
      setContacts([]);
      return;
    }

    setDetailLoading(true);
    const listResult = await getMailingListWithContacts(String(listId));

    if (listResult.data) {
      setSelectedList(listResult.data);
      setContacts(listResult.data.contacts || []);
    }

    if (listResult.error) {
      showBackendError(listResult.error, { title: "Unable to load list" });
    }

    setDetailLoading(false);
  };

  useEffect(() => {
    void loadLists();
  }, []);

  useEffect(() => {
    void loadDetails(selectedId);
  }, [selectedId]);

  const handleCreateList = async () => {
    const name = createForm.name.trim();
    const description = createForm.description.trim();

    if (!name) {
      showToast("List name is required.", "warning");
      return false;
    }

    if (importFile) {
      const formData = new FormData();
      formData.append("name", name);
      if (description) {
        formData.append("description", description);
      }
      formData.append("file", importFile);

      const result = await importMailingList(formData);
      if (result.error) {
        showBackendError(result.error, { title: "Unable to import list" });
        return false;
      }

      showToast(
        `Imported ${result.data?.imported ?? 0} contacts (skipped ${
          result.data?.skipped ?? 0
        }).`,
      );
      setImportFile(null);
      setCreateForm({ name: "", description: "" });
      setShowCreateModal(false);
      await loadLists();
      if (result.data?.mailingListId) {
        setSelectedId(result.data.mailingListId);
      }
      return true;
    }

    const result = await createMailingList({
      name,
      description: description || undefined,
    });

    if (result.error) {
      showBackendError(result.error, { title: "Unable to create list" });
      return false;
    }

    showToast("Mailing list created.");
    setCreateForm({ name: "", description: "" });
    setShowCreateModal(false);
    await loadLists();
    return true;
  };

  const handleAddContact = async () => {
    if (!selectedId) {
      showToast("Select a list to add contacts.", "warning");
      return;
    }

    if (!contactForm.email.trim()) {
      showToast("Email is required.", "warning");
      return;
    }

    const result = await addContact(String(selectedId), {
      email: contactForm.email.trim(),
      firstName: contactForm.firstName.trim() || undefined,
      lastName: contactForm.lastName.trim() || undefined,
    });

    if (result.error) {
      showBackendError(result.error, { title: "Unable to add contact" });
      return;
    }

    setContactForm({ email: "", firstName: "", lastName: "" });
    showToast("Contact added.");
    setShowAddContactModal(false);
    await loadDetails(selectedId);
    await loadLists();
  };

  const handleCopyList = async () => {
    if (!selectedId) {
      showToast("Select a list to copy.", "warning");
      return;
    }

    const result = await copyMailingList(String(selectedId));
    if (result.error) {
      showBackendError(result.error, { title: "Unable to copy list" });
      return;
    }

    showToast("List copied.");
    await loadLists();
    if (result.data?.id) {
      setSelectedId(result.data.id);
    }
  };

  const handleToggleHidden = async () => {
    if (!selectedId || !selectedList) {
      showToast("Select a list to update.", "warning");
      return;
    }

    const nextHidden = !selectedList.hidden;
    const result = await toggleMailingListHidden(
      String(selectedId),
      nextHidden,
    );

    if (result.error) {
      showBackendError(result.error, { title: "Unable to update list" });
      return;
    }

    showToast(nextHidden ? "List hidden." : "List restored.");
    await loadLists();
    await loadDetails(selectedId);
  };

  const handleDeleteList = async () => {
    if (!selectedId) {
      showToast("Select a list to delete.", "warning");
      return;
    }

    setConfirmDialog({
      title: "Delete mailing list",
      message: "Delete this mailing list? This cannot be undone.",
      confirmLabel: "Delete list",
      confirmClassName: "action-delete",
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await deleteMailingList(String(selectedId));
        if (result.error) {
          const message = parseBackendErrorMessage(result.error);
          const normalized = message.toLowerCase();
          const canHide =
            normalized.includes("used by campaigns") ||
            normalized.includes("hide it");
          showBackendError(result.error, {
            title: "Unable to delete list",
            actionLabel: canHide ? "Hide list" : undefined,
            actionClassName: canHide ? "action-hidden" : undefined,
            onAction: canHide
              ? async () => {
                  setErrorDialog(null);
                  const hiddenResult = await toggleMailingListHidden(
                    String(selectedId),
                    true,
                  );
                  if (hiddenResult.error) {
                    showBackendError(hiddenResult.error, {
                      title: "Unable to hide list",
                    });
                    return;
                  }
                  showToast("List hidden.");
                  await loadLists();
                  await loadDetails(selectedId);
                }
              : undefined,
          });
          return;
        }

        showToast("Mailing list deleted.");
        setSelectedId(null);
        await loadLists();
      },
    });
  };

  const handleImportToList = async () => {
    if (!selectedId) {
      showToast("Select a list to import contacts.", "warning");
      return;
    }

    if (!importTargetFile) {
      showToast("Choose a CSV file to import.", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("file", importTargetFile);

    const result = await importMailingListTo(String(selectedId), formData);
    if (result.error) {
      showBackendError(result.error, { title: "Unable to import contacts" });
      return;
    }

    showToast(
      `Imported ${result.data?.imported ?? 0} contacts (skipped ${
        result.data?.skipped ?? 0
      }).`,
    );
    setImportTargetFile(null);
    setShowImportContactsModal(false);
    await loadDetails(selectedId);
    await loadLists();
  };

  const openEditContact = (contact: Contact) => {
    setContactEdit(contact);
    setContactEditForm({
      email: contact.email,
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
    });
  };

  const handleUpdateContact = async () => {
    if (!selectedId || !contactEdit) {
      showToast("Select a contact to update.", "warning");
      return;
    }

    const result = await updateContact(
      String(selectedId),
      String(contactEdit.id),
      {
        email: contactEditForm.email.trim() || undefined,
        firstName: contactEditForm.firstName.trim() || undefined,
        lastName: contactEditForm.lastName.trim() || undefined,
      },
    );

    if (result.error) {
      showBackendError(result.error, { title: "Unable to update contact" });
      return;
    }

    showToast("Contact updated.");
    setContactEdit(null);
    await loadDetails(selectedId);
    await loadLists();
  };

  const handleRemoveContact = async (contactId: number) => {
    if (!selectedId) {
      showToast("Select a list to remove contacts.", "warning");
      return;
    }

    setConfirmDialog({
      title: "Remove contact",
      message: "Remove this contact from the list?",
      confirmLabel: "Remove contact",
      confirmClassName: "action-delete",
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await removeContact(
          String(selectedId),
          String(contactId),
          true,
        );
        if (result.error) {
          showBackendError(result.error, { title: "Unable to remove contact" });
          return;
        }

        showToast("Contact removed.");
        await loadDetails(selectedId);
        await loadLists();
      },
    });
  };

  const sortedLists = useMemo(
    () => [...lists].sort((a, b) => a.name.localeCompare(b.name)),
    [lists],
  );

  const activeLists = useMemo(
    () => sortedLists.filter((list) => !list.hidden),
    [sortedLists],
  );

  const hiddenLists = useMemo(
    () => sortedLists.filter((list) => list.hidden),
    [sortedLists],
  );

  const contactColumns: TableColumn<Contact>[] = [
    {
      key: "email",
      header: "Email",
      cell: (contact) => contact.email,
    },
    {
      key: "name",
      header: "Name",
      cell: (contact) => (
        <>
          {contact.firstName || ""} {contact.lastName || ""}
        </>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (contact) => (
        <span className="row-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => openEditContact(contact)}
          >
            Edit
          </button>
          <button
            type="button"
            className="button secondary action-delete"
            onClick={() => handleRemoveContact(contact.id)}
          >
            Remove
          </button>
        </span>
      ),
    },
  ];

  return (
    <div className="workspace-layout">
      <aside className="workspace-sidebar pressable">
        <div className="sidebar-header">
          <div className="sidebar-header-row">
            <h2>Mailing lists</h2>
            <Toggle
              label="Hidden"
              checked={showHidden}
              onChange={setShowHidden}
            />
          </div>
          <p>{loading ? "Loading..." : `${lists.length} total`}</p>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setImportFile(null);
            setShowCreateModal(true);
          }}
        >
          New list
        </button>
        <div className={`sidebar-sections ${showHidden ? "split" : ""}`}>
          <div className="sidebar-section">
            <p className="sidebar-section-title">Active</p>
            <div className="sidebar-scroll">
              <div className="sidebar-list">
                {activeLists.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    className={`sidebar-item ${
                      selectedId === list.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedId(list.id)}
                  >
                    <span>{list.name}</span>
                    <span className="pill-small">{counts[list.id] ?? 0}</span>
                  </button>
                ))}
                {!loading && activeLists.length === 0 ? (
                  <p className="muted">No active lists.</p>
                ) : null}
              </div>
            </div>
          </div>
          {showHidden ? (
            <div className="sidebar-section">
              <p className="sidebar-section-title">Hidden</p>
              <div className="sidebar-scroll">
                <div className="sidebar-list">
                  {hiddenLists.map((list) => (
                    <button
                      key={list.id}
                      type="button"
                      className={`sidebar-item ${
                        selectedId === list.id ? "active" : ""
                      }`}
                      onClick={() => setSelectedId(list.id)}
                    >
                      <span>{list.name}</span>
                      <span className="pill-small">{counts[list.id] ?? 0}</span>
                    </button>
                  ))}
                  {!loading && hiddenLists.length === 0 ? (
                    <p className="muted">No hidden lists.</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          {!loading && sortedLists.length === 0 ? (
            <p className="muted">No lists yet.</p>
          ) : null}
        </div>
      </aside>

      <section className="workspace-detail">
        <div className="panel pressable workspace-panel">
          <div className="panel-header">
            <h2>List details</h2>
            <p>View description and manage contacts.</p>
          </div>
          {detailLoading ? (
            <p>Loading list details...</p>
          ) : selectedList ? (
            <>
              <div className="field-grid">
                <label className="field">
                  <span>Name</span>
                  <input value={selectedList.name} readOnly />
                </label>
                <label className="field">
                  <span>Description</span>
                  <input value={selectedList.description || ""} readOnly />
                </label>
              </div>
              <div className="row-actions">
                <button type="button" onClick={handleCopyList}>
                  Copy list
                </button>
                <button
                  type="button"
                  className={`action-hidden ${
                    selectedList.hidden ? "active" : ""
                  }`}
                  onClick={handleToggleHidden}
                >
                  {selectedList.hidden ? "Unhide list" : "Hide list"}
                </button>
                <button
                  type="button"
                  className="action-delete"
                  onClick={handleDeleteList}
                >
                  Delete list
                </button>
              </div>
              <div className="divider" />

              <div className="panel-header">
                <h3>Contacts</h3>
                <p>Manage subscribers for this list.</p>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(true)}
                >
                  Add contact
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowImportContactsModal(true)}
                >
                  Import contacts
                </button>
              </div>

              <div className="table-section">
                <ScrollableTable
                  data={contacts}
                  columns={contactColumns}
                  rowKey={(contact) => contact.id}
                  emptyState={<p className="muted">No contacts yet.</p>}
                />
              </div>
            </>
          ) : (
            <p className="muted">Select a list to see details.</p>
          )}
        </div>

        {showCreateModal ? (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal pressable">
              <h3>Create mailing list</h3>
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
                    placeholder="Newsletter Q1"
                  />
                </label>
                <label className="field">
                  <span>Description</span>
                  <input
                    value={createForm.description}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="General updates for Q1"
                  />
                </label>
              </div>
              <div className="divider" />
              <p className="muted">Optional: import a CSV to seed the list.</p>
              <ImportFileActions
                file={importFile}
                onFileChange={setImportFile}
                showImportButton={false}
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setImportFile(null);
                    setShowCreateModal(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="action-save"
                  onClick={async () => {
                    const didCreate = await handleCreateList();
                    if (didCreate) {
                      setImportFile(null);
                    }
                  }}
                >
                  Create list
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showAddContactModal ? (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal pressable">
              <h3>Add contact</h3>
              <div className="field-grid">
                <label className="field">
                  <span>First name</span>
                  <input
                    value={contactForm.firstName}
                    onChange={(event) =>
                      setContactForm((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Last name</span>
                  <input
                    value={contactForm.lastName}
                    onChange={(event) =>
                      setContactForm((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field field-wide">
                  <span>Email</span>
                  <input
                    value={contactForm.email}
                    onChange={(event) =>
                      setContactForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowAddContactModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="action-save"
                  onClick={handleAddContact}
                >
                  Add contact
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showImportContactsModal ? (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal pressable">
              <h3>Import contacts</h3>
              <p className="muted">Upload a CSV file for this list.</p>
              <ImportFileActions
                file={importTargetFile}
                onFileChange={setImportTargetFile}
                onImport={handleImportToList}
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowImportContactsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {contactEdit ? (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal pressable">
              <h3>Edit contact</h3>
              <div className="field-grid">
                <label className="field">
                  <span>First name</span>
                  <input
                    value={contactEditForm.firstName}
                    onChange={(event) =>
                      setContactEditForm((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Last name</span>
                  <input
                    value={contactEditForm.lastName}
                    onChange={(event) =>
                      setContactEditForm((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field field-wide">
                  <span>Email</span>
                  <input
                    value={contactEditForm.email}
                    onChange={(event) =>
                      setContactEditForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setContactEdit(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="action-save"
                  onClick={handleUpdateContact}
                >
                  Save contact
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
        <Toast
          message={toastMessage}
          tone={toastTone}
          onDismiss={() => setToastMessage(null)}
        />
      ) : null}
    </div>
  );
}
