import { auth0 } from "./auth0";

const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL || "http://localhost:8080";
const CORE_API_PREFIX = process.env.CORE_API_PREFIX || "/api/core";

export const API_ENDPOINTS = {
  campaigns: `${CORE_API_PREFIX}/campaigns`,
  campaignById: (campaignId: string) =>
    `${CORE_API_PREFIX}/campaigns/${campaignId}`,
  campaignSend: (campaignId: string) =>
    `${CORE_API_PREFIX}/campaigns/${campaignId}/send`,
  campaignCopy: (campaignId: string) =>
    `${CORE_API_PREFIX}/campaigns/${campaignId}/copy`,
  mailingLists: `${CORE_API_PREFIX}/mailing-lists`,
  mailingListById: (listId: string) =>
    `${CORE_API_PREFIX}/mailing-lists/${listId}`,
  mailingListCopy: (listId: string) =>
    `${CORE_API_PREFIX}/mailing-lists/${listId}/copy`,
  mailingListWithContacts: (listId: string) =>
    `${CORE_API_PREFIX}/mailing-lists/${listId}/with-contacts`,
  mailingListImport: `${CORE_API_PREFIX}/mailing-lists/import`,
  mailingListImportTo: (listId: string) =>
    `${CORE_API_PREFIX}/mailing-lists/${listId}/import`,
  mailingListContacts: (listId: string) =>
    `${CORE_API_PREFIX}/mailing-lists/${listId}/contacts`,
  mailingListContactById: (listId: string, contactId: string) =>
    `${CORE_API_PREFIX}/mailing-lists/${listId}/contacts/${contactId}`,
} as const;

export interface CampaignDraftPayload {
  name: string;
  mailingListIds?: number[];
  mailingListId?: number;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  excludedContactIds?: number[];
}

export interface CampaignMailingList {
  id: number;
  name: string;
}

export interface Campaign {
  id: number;
  name: string;
  mailingListId?: number;
  mailingLists?: CampaignMailingList[];
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  status?: string;
  createdAt?: string;
  sentAt?: string | null;
  excludedContactIds?: number[];
  updatedAt?: string;
}

export interface MailingList {
  id: number;
  name: string;
  description?: string;
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

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Makes an authenticated request to the backend API
 */
export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const session = await auth0.getSession();

    if (!session?.tokenSet?.accessToken) {
      return {
        error: "Not authenticated",
        status: 401,
      };
    }

    const accessToken = session.tokenSet.accessToken;
    const url = `${BACKEND_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(
      `API Request to ${url} responded with status ${response.status}`,
    );

    const status = response.status;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        error: errorText || `HTTP Error: ${status}`,
        status,
      };
    }

    // Try to parse as JSON, fall back to text
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      return { data, status };
    } else {
      const text = await response.text();
      return { data: text as T, status };
    }
  } catch (error) {
    console.error("API request failed:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
      status: 500,
    };
  }
}

/**
 * GET request with authentication
 */
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(endpoint, { method: "GET" });
}

/**
 * POST request with authentication
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Campaigns
 */
export async function fetchCampaigns() {
  return apiGet<Campaign[]>(API_ENDPOINTS.campaigns);
}

export async function fetchCampaign(campaignId: string) {
  return apiGet<Campaign>(API_ENDPOINTS.campaignById(campaignId));
}

export async function createCampaign(payload: CampaignDraftPayload) {
  return apiPost<Campaign>(API_ENDPOINTS.campaigns, payload);
}

export async function updateCampaign(
  campaignId: string,
  payload: Partial<CampaignDraftPayload>,
) {
  return fetchWithAuth<Campaign>(API_ENDPOINTS.campaignById(campaignId), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function sendCampaign(campaignId: string) {
  return apiPost(API_ENDPOINTS.campaignSend(campaignId));
}

export async function copyCampaign(campaignId: string) {
  return apiPost<Campaign>(API_ENDPOINTS.campaignCopy(campaignId));
}

export async function deleteCampaign(campaignId: string) {
  return fetchWithAuth(API_ENDPOINTS.campaignById(campaignId), {
    method: "DELETE",
  });
}

/**
 * Mailing lists
 */
export async function fetchMailingLists() {
  return apiGet<MailingList[]>(API_ENDPOINTS.mailingLists);
}

export async function fetchMailingList(listId: string) {
  return apiGet<MailingList>(API_ENDPOINTS.mailingListById(listId));
}

export async function fetchMailingListWithContacts(listId: string) {
  return apiGet<MailingListWithContacts>(
    API_ENDPOINTS.mailingListWithContacts(listId),
  );
}

export async function createMailingList(payload: {
  name: string;
  description?: string;
}) {
  return apiPost<MailingList>(API_ENDPOINTS.mailingLists, payload);
}

export async function updateMailingList(
  listId: string,
  payload: { name?: string; description?: string },
) {
  return fetchWithAuth<MailingList>(API_ENDPOINTS.mailingListById(listId), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteMailingList(listId: string) {
  return fetchWithAuth(API_ENDPOINTS.mailingListById(listId), {
    method: "DELETE",
  });
}

export async function copyMailingList(listId: string) {
  return apiPost<MailingList>(API_ENDPOINTS.mailingListCopy(listId));
}

export async function importMailingList(payload: FormData) {
  return fetchWithAuth<ImportResult>(API_ENDPOINTS.mailingListImport, {
    method: "POST",
    body: payload,
  });
}

export async function importMailingListTo(listId: string, payload: FormData) {
  return fetchWithAuth<ImportResult>(
    API_ENDPOINTS.mailingListImportTo(listId),
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function fetchMailingListContacts(listId: string) {
  return apiGet<Contact[]>(API_ENDPOINTS.mailingListContacts(listId));
}

export async function addMailingListContact(
  listId: string,
  payload: {
    email: string;
    firstName?: string;
    lastName?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return apiPost<Contact>(API_ENDPOINTS.mailingListContacts(listId), payload);
}

export async function updateMailingListContact(
  listId: string,
  contactId: string,
  payload: {
    email?: string;
    firstName?: string;
    lastName?: string;
  },
) {
  return fetchWithAuth<Contact>(
    API_ENDPOINTS.mailingListContactById(listId, contactId),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export async function removeMailingListContact(
  listId: string,
  contactId: string,
  softDelete?: boolean,
) {
  const suffix =
    softDelete === undefined
      ? ""
      : `?softDelete=${softDelete ? "true" : "false"}`;
  return fetchWithAuth(
    `${API_ENDPOINTS.mailingListContactById(listId, contactId)}${suffix}`,
    { method: "DELETE" },
  );
}
