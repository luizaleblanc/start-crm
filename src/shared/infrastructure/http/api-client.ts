const SESSION_STORAGE_KEY = "start-crm.session";

interface StoredSession {
  accessToken: string;
  user: unknown;
}

let cachedRaw: string | null = null;
let cachedSession: StoredSession | null = null;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match && match[1] ? decodeURIComponent(match[1]) : null;
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      if (raw === cachedRaw && cachedSession) return cachedSession;
      cachedRaw = raw;
      cachedSession = JSON.parse(raw) as StoredSession;
      return cachedSession;
    }

    // Fallback: recupera via cookie se o localStorage estiver vazio
    const cookieRaw = readCookie(SESSION_STORAGE_KEY);
    if (cookieRaw) {
      if (cookieRaw === cachedRaw && cachedSession) return cachedSession;
      try {
        const parsed = JSON.parse(cookieRaw) as StoredSession;
        if (parsed?.accessToken) {
          window.localStorage.setItem(SESSION_STORAGE_KEY, cookieRaw);
          cachedRaw = cookieRaw;
          cachedSession = parsed;
          return cachedSession;
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  cachedRaw = null;
  cachedSession = null;
  return null;
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
    cachedRaw = null;
    cachedSession = null;
    try {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      document.cookie = `${SESSION_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
    } catch {
      // ignore
    }
  } else {
    try {
      const raw = JSON.stringify(session);
      cachedRaw = raw;
      cachedSession = session;
      window.localStorage.setItem(SESSION_STORAGE_KEY, raw);
      // Persiste por 30 dias em cookie para sobrevivência entre recarregamentos
      document.cookie = `${SESSION_STORAGE_KEY}=${encodeURIComponent(raw)}; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
    } catch {
      // ignore
    }
  }
  sessionListeners.forEach((listener) => listener());
}

export class ApiClientError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
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
    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    // Se receber 401 em rota autenticada fora de /login, a sessão expirou
    if (response.status === 401 && auth && typeof window !== "undefined") {
      if (window.location.pathname !== "/login") {
        setStoredSession(null);
        window.location.replace("/login");
      }
    }
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : "Erro inesperado";
    throw new ApiClientError(response.status, message);
  }

  return payload as T;
}
