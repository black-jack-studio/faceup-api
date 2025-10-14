import type { User } from "@shared/schema";

const INVALID_JSON = Symbol("invalid-json");

export const API_URL = "https://faceup-api.onrender.com";

export function getApiUrl(path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${API_URL}${path}`;
}

function buildHeaders(init: RequestInit): Headers {
  const headers = new Headers(init.headers || {});
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

function parseJsonSafe(text: string): any {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return INVALID_JSON;
  }
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = getApiUrl(path);
  const headers = buildHeaders(init);

  const response = await fetch(url, {
    ...init,
    credentials: "include", // indispensable pour les cookies de session
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const hasJsonBody = contentType.includes("application/json");
  const clone = response.clone();
  let rawBody: string | null = null;
  let parsedBody: any = null;
  let invalidJson = false;

  try {
    rawBody = await clone.text();
    if (rawBody) {
      parsedBody = hasJsonBody ? parseJsonSafe(rawBody) : rawBody;
      invalidJson = parsedBody === INVALID_JSON;
    }
  } catch {
    // Ignore body read issues when handling errors
  }

  if (!response.ok) {
    const error = new Error(
      (!invalidJson && parsedBody && typeof parsedBody === "object" && "message" in parsedBody && parsedBody.message) ||
        (typeof parsedBody === "string" && parsedBody.length ? parsedBody : `${response.status} ${response.statusText}`)
    );

    (error as any).status = response.status;

    if (!invalidJson && parsedBody && typeof parsedBody === "object") {
      Object.assign(error, parsedBody);
    }

    throw error;
  }

  if (response.status !== 204 && hasJsonBody && rawBody && invalidJson) {
    throw new Error("Invalid JSON response");
  }

  return response;
}

type AuthSuccessResponse = { user: User };

export async function register(params: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<AuthSuccessResponse> {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function login(params: { username: string; password: string }): Promise<AuthSuccessResponse> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", {
    method: "POST",
  });
}
