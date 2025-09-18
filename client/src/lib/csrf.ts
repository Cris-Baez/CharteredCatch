const CSRF_ENDPOINT = "/api/auth/csrf-token";

async function requestCsrfToken(): Promise<string> {
  const response = await fetch(CSRF_ENDPOINT, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve CSRF token");
  }

  const data = (await response.json()) as { csrfToken?: string };
  if (!data || typeof data.csrfToken !== "string" || data.csrfToken.length === 0) {
    throw new Error("Invalid CSRF token response");
  }

  return data.csrfToken;
}

export async function fetchWithCsrf(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const csrfToken = await requestCsrfToken();
  const headers = new Headers(init.headers ?? {});
  headers.set("X-CSRF-Token", csrfToken);

  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
  });
}

export async function getCsrfToken(): Promise<string> {
  return requestCsrfToken();
}
