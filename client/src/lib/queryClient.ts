import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";

/** Base API: natif => Render, web => relatif */
const API_BASE = Capacitor.isNativePlatform()
  ? "https://faceup-api.onrender.com"
  : "";

/** Normalisation des erreurs fetch */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorData = await res.json();
      const error = new Error(errorData.message || res.statusText);
      Object.assign(error, errorData);
      throw error;
    } catch {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

/** (Compat) plus de CSRF en mobile, on garde le symbole pour éviter les imports cassés */
export function invalidateCSRFToken() {
  /* no-op */
}

/** Appel API générique (cookies + base URL) */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  _options?: { skipCSRF?: boolean } // ignoré : pas de CSRF en mobile
): Promise<Response> {
  const fullUrl = `${API_BASE}${url}`;
  const headers: Record<string, string> = {};
  if (data !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(fullUrl, {
    method,
    credentials: "include",
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/** ✅ Version fonction générique (pas d’erreur “Cannot find name 'T'”) */
export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  return async ({ queryKey }) => {
    const [url] = queryKey as [string, ...unknown[]];
    const res = await fetch(`${API_BASE}${url}`, { credentials: "include" });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null as unknown as T;
    }

    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };
}

/** React Query Client */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
    mutations: { retry: false },
  },
});