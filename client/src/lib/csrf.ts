import { apiFetch } from "@/lib/api";

let cachedToken: string | undefined;

export async function fetchCSRFToken(): Promise<string> {
  const res = await apiFetch("/api/auth/csrf");
  if (!res.ok) throw new Error("Failed to fetch CSRF token");
  const { csrfToken } = await res.json();
  cachedToken = csrfToken;
  return csrfToken;
}

export async function getCSRFToken(): Promise<string> {
  return cachedToken ?? fetchCSRFToken();
}

export function clearCSRFToken() {
  cachedToken = undefined;
}

export async function ensureCSRF() {
  try { await getCSRFToken(); } catch { /* noop: on précharge juste */ }
}