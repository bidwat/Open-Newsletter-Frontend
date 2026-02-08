"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Toast from "@/src/components/Toast";
import {
  addContact,
  copyMailingList,
  createMailingList,
  getMailingListWithContacts,
  importMailingList,
  importMailingListTo,
  listContacts,
  listMailingLists,
  removeContact,
  type Contact,
  type MailingList,
  updateContact,
} from "@/src/services/mailingLists";

interface ContactCounts {
  [listId: string]: number;
}

export default function MailingListsWorkspace() {
  const [lists, setLists] = useState<MailingList[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedList, setSelectedList] = useState<MailingList | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [counts, setCounts] = useState<ContactCounts>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showImportContactsModal, setShowImportContactsModal] = useState(false);
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
  const importContactsInputRef = useRef<HTMLInputElement | null>(null);

  const loadLists = async () => {
    setLoading(true);
    const result = await listMailingLists();
    if (result.error) {
      setStatusMessage(result.error);
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
      setStatusMessage(listResult.error || null);
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
    if (!createForm.name.trim()) {
      setStatusMessage("List name is required.");
      return;
    }

    const result = await createMailingList({
      name: createForm.name.trim(),
      description: createForm.description.trim() || undefined,
    });

    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setToastMessage("Mailing list created.");
    setCreateForm({ name: "", description: "" });
    setShowCreateModal(false);
    await loadLists();
  };

  const handleAddContact = async () => {
    if (!selectedId) {
      setStatusMessage("Select a list to add contacts.");
      return;
    }

    if (!contactForm.email.trim()) {
      setStatusMessage("Email is required.");
      return;
    }

    const result = await addContact(String(selectedId), {
      email: contactForm.email.trim(),
      firstName: contactForm.firstName.trim() || undefined,
      lastName: contactForm.lastName.trim() || undefined,
    });

    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setContactForm({ email: "", firstName: "", lastName: "" });
    setToastMessage("Contact added.");
    setShowAddContactModal(false);
    await loadDetails(selectedId);
    await loadLists();
  };

  const handleCopyList = async () => {
    if (!selectedId) {
      setStatusMessage("Select a list to copy.");
      return;
    }

    const result = await copyMailingList(String(selectedId));
    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setToastMessage("List copied.");
    await loadLists();
    if (result.data?.id) {
      setSelectedId(result.data.id);
    }
  };

  const handleImportNewList = async () => {
    if (!importFile) {
      setStatusMessage("Choose a CSV file to import.");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    const result = await importMailingList(formData);
    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setToastMessage(
      `Imported ${result.data?.imported ?? 0} contacts (skipped ${
        result.data?.skipped ?? 0
      }).`,
    );
    setImportFile(null);
    setShowImportModal(false);
    await loadLists();
    if (result.data?.mailingListId) {
      setSelectedId(result.data.mailingListId);
    }
  };

  const handleImportToList = async () => {
    if (!selectedId) {
      setStatusMessage("Select a list to import contacts.");
      return;
    }

    if (!importTargetFile) {
      setStatusMessage("Choose a CSV file to import.");
      return;
    }

    const formData = new FormData();
    formData.append("file", importTargetFile);

    const result = await importMailingListTo(String(selectedId), formData);
    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setToastMessage(
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
      setStatusMessage("Select a contact to update.");
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
      setStatusMessage(result.error);
      return;
    }

    setToastMessage("Contact updated.");
    setContactEdit(null);
    await loadDetails(selectedId);
    await loadLists();
  };

  const handleRemoveContact = async (contactId: number) => {
    if (!selectedId) {
      setStatusMessage("Select a list to remove contacts.");
      return;
    }

    const confirmed = window.confirm("Remove this contact from the list?");
    if (!confirmed) {
      return;
    }

    const result = await removeContact(
      String(selectedId),
      String(contactId),
      true,
    );
    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setToastMessage("Contact removed.");
    await loadDetails(selectedId);
    await loadLists();
  };

  const sortedLists = useMemo(
    () => [...lists].sort((a, b) => a.name.localeCompare(b.name)),
    [lists],
  );

  return (
    <div className="workspace-layout">
      <aside className="workspace-sidebar pressable">
        <div className="sidebar-header">
          <h2>Mailing lists</h2>
          <p>{loading ? "Loading..." : `${lists.length} total`}</p>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={() => setShowCreateModal(true)}
        >
          New list
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => setShowImportModal(true)}
        >
          Import list
        </button>
        <div className="sidebar-list">
          {sortedLists.map((list) => (
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
          {!loading && sortedLists.length === 0 ? (
            <p className="muted">No lists yet.</p>
          ) : null}
        </div>
      </aside>

      <section className="workspace-detail">
        <div className="panel pressable">
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

              {contacts.length === 0 ? (
                <p className="muted">No contacts yet.</p>
              ) : (
                <div className="table">
                  <div className="table-row table-head">
                    <span>Email</span>
                    <span>Name</span>
                    <span>Actions</span>
                  </div>
                  {contacts.map((contact) => (
                    <div key={contact.id} className="table-row">
                      <span>{contact.email}</span>
                      <span>
                        {contact.firstName || ""} {contact.lastName || ""}
                      </span>
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
                          className="button secondary"
                          onClick={() => handleRemoveContact(contact.id)}
                        >
                          Remove
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="muted">Select a list to see details.</p>
          )}
        </div>

        {statusMessage ? (
          <p className="status-message inline">{statusMessage}</p>
        ) : null}

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
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="button" onClick={handleCreateList}>
                  Create list
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showImportModal ? (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal pressable">
              <h3>Import mailing list</h3>
              <div className="field-grid">
                <label className="field field-wide">
                  <span>CSV file</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(event) =>
                      setImportFile(
                        event.target.files ? event.target.files[0] : null,
                      )
                    }
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </button>
                <button type="button" onClick={handleImportNewList}>
                  Import list
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
                <button type="button" onClick={handleAddContact}>
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
              <div className="file-actions">
                <span className="file-name">
                  {importTargetFile
                    ? importTargetFile.name
                    : "No file selected"}
                </span>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => importContactsInputRef.current?.click()}
                >
                  Select file
                </button>
                <button type="button" onClick={handleImportToList}>
                  Import
                </button>
              </div>
              <input
                ref={importContactsInputRef}
                type="file"
                accept=".csv"
                className="visually-hidden"
                onChange={(event) =>
                  setImportTargetFile(
                    event.target.files ? event.target.files[0] : null,
                  )
                }
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
                <button type="button" onClick={handleUpdateContact}>
                  Save contact
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
