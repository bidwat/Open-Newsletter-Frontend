export interface UserProfile {
  id?: number;
  email?: string;
  name: string;
  username: string;
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
  } catch {
    return {
      error: response.ok ? "Invalid response" : "Request failed",
      status,
    };
  }
}

export async function updateMyProfile(payload: {
  name: string;
  username: string;
}) {
  const response = await fetch("/api/me/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<UserProfile>(response);
}

export async function getMyProfile() {
  const response = await fetch("/api/me/profile", {
    method: "GET",
  });

  return parseResponse<UserProfile>(response);
}
