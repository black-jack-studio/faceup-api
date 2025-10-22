import type { User } from '@shared/schema';
import { CONFIG } from './config';
import { createLogger } from './logger';
import { supabase } from './supabase';

const INVALID_JSON = Symbol('invalid-json');

const authLogger = createLogger('AUTH_SYNC');

export type ApiError = Error & {
  status?: number;
  errorType?: string;
  details?: unknown;
};

function ensureApiBase(): string {
  if (!CONFIG.API_URL) {
    throw new Error('API_URL is not configured. Please set VITE_API_URL.');
  }
  return CONFIG.API_URL.replace(/\/$/, '');
}

export function getApiUrl(path: string): string {
  const baseUrl = ensureApiBase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

function buildHeaders(init: RequestInit): Headers {
  const headers = new Headers(init.headers || {});
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
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

async function getSessionAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    authLogger.warn('Unable to read Supabase session', error);
    return null;
  }
  const token = data.session?.access_token ?? null;
  if (!token) {
    authLogger.debug('No Supabase session token available for API request');
  }
  return token;
}

async function refreshSessionAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    authLogger.error('Failed to refresh Supabase session', error);
    return null;
  }
  const token = data.session?.access_token ?? null;
  if (!token) {
    authLogger.warn('Session refresh completed but no access token was returned');
  } else {
    authLogger.info('Supabase session refreshed after 401 response');
  }
  return token;
}

async function executeFetch(url: string, init: RequestInit, headers: Headers, retryOn401 = true): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (response.status === 401 && retryOn401) {
    authLogger.warn('Received 401 response. Attempting session refresh.');
    const refreshedToken = await refreshSessionAccessToken();
    if (refreshedToken) {
      headers.set('Authorization', `Bearer ${refreshedToken}`);
      return executeFetch(url, init, headers, false);
    }
  }

  return response;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = getApiUrl(path);
  const headers = buildHeaders(init);

  const token = await getSessionAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    headers.delete('Authorization');
  }

  const response = await executeFetch(url, init, headers);

  const contentType = response.headers.get('content-type') ?? '';
  const hasJsonBody = contentType.includes('application/json');
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
    const message =
      (!invalidJson && parsedBody && typeof parsedBody === 'object' && 'message' in parsedBody && parsedBody.message) ||
      (typeof parsedBody === 'string' && parsedBody.length ? parsedBody : `${response.status} ${response.statusText}`);

    const error = new Error(String(message)) as ApiError;
    error.status = response.status;

    if (!invalidJson && parsedBody && typeof parsedBody === 'object') {
      if ('errorType' in parsedBody && typeof parsedBody.errorType === 'string') {
        error.errorType = parsedBody.errorType;
      }
      error.details = parsedBody;
    } else if (rawBody) {
      error.details = rawBody;
    }

    throw error;
  }

  if (response.status !== 204 && hasJsonBody && rawBody && invalidJson) {
    throw new Error('Invalid JSON response');
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
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function login(params: { username: string; password: string }): Promise<AuthSuccessResponse> {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', {
    method: 'POST',
  });
}
