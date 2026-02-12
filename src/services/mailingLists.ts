export interface MailingList {
  id: number;
  name: string;
  description?: string;
  hidden?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  metadata?: Record<string, unknown>;
}

export interface MailingListWithContacts extends MailingList {
  contacts: Contact[];
}

export interface ImportResult {
  mailingListId: number;
  imported: number;
  skipped: number;
}

interface ClientApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

async function parseResponse<T>(
  response: Response,
): Promise<ClientApiResponse<T>> {
  const status = response.status;

  try {
    const data = await response.json();
    if (!response.ok) {
      return {
        error: data?.error || "Request failed",
        status,
      };
    }

    return { data, status };
  } catch (error) {
    return {
      error: response.ok ? "Invalid response" : "Request failed",
      status,
    };
  }
}

export async function listMailingLists() {
  const response = await fetch("/api/mailing-lists", { method: "GET" });
  return parseResponse<MailingList[]>(response);
}

export async function getMailingList(listId: string) {
  if (!listId) {
    return { error: "Missing list ID.", status: 400 };
  }

  const response = await fetch(`/api/mailing-lists/${listId}`, {
    method: "GET",
  });

  return parseResponse<MailingList>(response);
}

export async function createMailingList(payload: {
  name: string;
  description?: string;
}) {
  const response = await fetch("/api/mailing-lists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<MailingList>(response);
}

export async function updateMailingList(
  listId: string,
  payload: { name?: string; description?: string },
) {
  if (!listId) {
    return { error: "Missing list ID.", status: 400 };
  }

  const response = await fetch(`/api/mailing-lists/${listId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<MailingList>(response);
}

export async function deleteMailingList(listId: string) {
  if (!listId) {
    return { error: "Missing list ID.", status: 400 };
  }

  const response = await fetch(`/api/mailing-lists/${listId}`, {
    method: "DELETE",
  });

  return parseResponse<{ message?: string }>(response);
}

export async function toggleMailingListHidden(listId: string, hidden: boolean) {
  if (!listId) {
    return { error: "Missing list ID.", status: 400 };
  }

  const response = await fetch(`/api/mailing-lists/${listId}/hidden`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hidden }),
  });

  return parseResponse<MailingList>(response);
}

export async function copyMailingList(listId: string) {
  if (!listId) {
    return { error: "Missing list ID.", status: 400 };
  }

  const response = await fetch(`/api/mailing-lists/${listId}/copy`, {
    method: "POST",
  });

  return parseResponse<MailingList>(response);
}

export async function getMailingListWithContacts(listId: string) {
  if (!listId) {
    return { error: "Missing list ID.", status: 400 };
  }

  const response = await fetch(`/api/mailing-lists/${listId}/with-contacts`, {
    method: "GET",
  });

  return parseResponse<MailingListWithContacts>(response);
}

export async function importMailingList(payload: FormData) {
  const response = await fetch("/api/mailing-lists/import", {
    method: "POST",
    body: payload,
  });

  return parseResponse<ImportResult>(response);
}

export async function importMailingListTo(listId: string, payload: FormData) {
  if (!listId) {
    return { error: "Missing list ID.", status: 400 };
  }

  const response = await fetch(`/api/mailing-lists/${listId}/import`, {
    method: "POST",
    body: payload,
  });

  return parseResponse<ImportResult>(response);
}

export async function listContacts(listId: string) {
  if (!listId) {
    return { error: "Missing list ID.", status: 400 };
  }

  const response = await fetch(`/api/mailing-lists/${listId}/contacts`, {
    method: "GET",
  });

  return parseResponse<Contact[]>(response);
}

export async function addContact(
  listId: string,
  payload: {
    email: string;
    firstName?: string;
    lastName?: string;
    metadata?: Record<string, unknown>;
  },
) {
  if (!listId) {
    return { error: "Missing list ID.", status: 400 };
  }

  const response = await fetch(`/api/mailing-lists/${listId}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<Contact>(response);
}

export async function updateContact(
  listId: string,
  contactId: string,
  payload: {
    email?: string;
    firstName?: string;
    lastName?: string;
  },
) {
  if (!listId || !contactId) {
    return { error: "Missing list or contact ID.", status: 400 };
  }

  const response = await fetch(
    `/api/mailing-lists/${listId}/contacts/${contactId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  return parseResponse<Contact>(response);
}

export async function removeContact(
  listId: string,
  contactId: string,
  softDelete?: boolean,
) {
  if (!listId || !contactId) {
    return { error: "Missing list or contact ID.", status: 400 };
  }

  const suffix =
    softDelete === undefined
      ? ""
      : `?softDelete=${softDelete ? "true" : "false"}`;
  const response = await fetch(
    `/api/mailing-lists/${listId}/contacts/${contactId}${suffix}`,
    { method: "DELETE" },
  );

  return parseResponse<{ message?: string }>(response);
}
