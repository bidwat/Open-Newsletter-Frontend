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

export interface CampaignAudienceContact {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  excluded?: boolean;
  sourceLists?: CampaignMailingList[];
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

export async function createDraft(payload: CampaignDraftPayload) {
  const response = await fetch("/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<Campaign>(response);
}

export async function updateDraft(
  campaignId: number,
  payload: Partial<CampaignDraftPayload>,
) {
  if (!campaignId) {
    return { error: "Missing campaign ID.", status: 400 };
  }

  const response = await fetch(`/api/campaigns/${campaignId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<Campaign>(response);
}

export async function listCampaigns() {
  const response = await fetch("/api/campaigns", { method: "GET" });
  return parseResponse<Campaign[]>(response);
}

export async function getCampaign(campaignId: number) {
  if (!campaignId) {
    return { error: "Missing campaign ID.", status: 400 };
  }

  const response = await fetch(`/api/campaigns/${campaignId}`, {
    method: "GET",
  });

  return parseResponse<Campaign>(response);
}

export async function sendCampaign(campaignId: number) {
  if (!campaignId) {
    return { error: "Missing campaign ID.", status: 400 };
  }

  const response = await fetch(`/api/campaigns/${campaignId}/send`, {
    method: "POST",
  });

  return parseResponse<{ message?: string }>(response);
}

export async function copyCampaign(campaignId: number) {
  if (!campaignId) {
    return { error: "Missing campaign ID.", status: 400 };
  }

  const response = await fetch(`/api/campaigns/${campaignId}/copy`, {
    method: "POST",
  });

  return parseResponse<Campaign>(response);
}

export async function deleteCampaign(campaignId: number) {
  if (!campaignId) {
    return { error: "Missing campaign ID.", status: 400 };
  }

  const response = await fetch(`/api/campaigns/${campaignId}`, {
    method: "DELETE",
  });

  return parseResponse<{ message?: string }>(response);
}

export async function getCampaignContacts(campaignId: number) {
  if (!campaignId) {
    return { error: "Missing campaign ID.", status: 400 };
  }

  const response = await fetch(`/api/campaigns/${campaignId}/contacts`, {
    method: "GET",
  });

  return parseResponse<CampaignAudienceContact[]>(response);
}

export async function toggleCampaignContactExclusion(
  campaignId: number,
  contactId: number,
  excluded: boolean,
) {
  if (!campaignId || !contactId) {
    return { error: "Missing campaign or contact ID.", status: 400 };
  }

  const response = await fetch(
    `/api/campaigns/${campaignId}/contacts/${contactId}/exclusion`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excluded }),
    },
  );

  return parseResponse<CampaignAudienceContact>(response);
}

export async function bulkUpdateCampaignContactExclusions(
  campaignId: number,
  payload: { contactIds: number[]; excluded: boolean },
) {
  if (!campaignId) {
    return { error: "Missing campaign ID.", status: 400 };
  }

  const response = await fetch(
    `/api/campaigns/${campaignId}/contacts/exclusions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  return parseResponse<{ updated?: number }>(response);
}
