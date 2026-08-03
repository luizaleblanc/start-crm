const SESSION_STORAGE_KEY = "start-crm.session";

interface StoredSession {
  accessToken: string;
  user: unknown;
}

let cachedRaw: string | null = null;
let cachedSession: StoredSession | null = null;

/**
 * Returns a cached reference while the underlying localStorage value is
 * unchanged, as required by useSyncExternalStore's getSnapshot contract —
 * parsing JSON on every call would return a new object each time and cause
 * an infinite re-render loop.
 */
export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (raw === cachedRaw) return cachedSession;

  cachedRaw = raw;
  if (!raw) {
    cachedSession = null;
    return null;
  }
  try {
    cachedSession = JSON.parse(raw) as StoredSession;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

type SessionListener = () => void;
const sessionListeners = new Set<SessionListener>();

export function subscribeToSession(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    sessionListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function setStoredSession(session: StoredSession | null): void {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
  sessionListeners.forEach((listener) => listener());
}

export class ApiClientError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const session = getStoredSession();
    if (session) headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : "Erro inesperado";
    throw new ApiClientError(response.status, message);
  }

  return payload as T;
}
