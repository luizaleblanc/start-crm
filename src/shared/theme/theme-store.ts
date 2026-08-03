const THEME_STORAGE_KEY = "start-crm.theme";

export type Theme = "light" | "dark";

let cachedRaw: string | null = null;
let cachedTheme: Theme = "light";

type ThemeListener = () => void;
const listeners = new Set<ThemeListener>();

/**
 * Same caching contract as api-client's getStoredSession: getSnapshot must
 * return a stable reference/value while localStorage is unchanged, or
 * useSyncExternalStore loops re-rendering forever.
 */
export function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === cachedRaw) return cachedTheme;
  cachedRaw = raw;
  cachedTheme = raw === "dark" ? "dark" : "light";
  return cachedTheme;
}

export function getServerTheme(): Theme {
  return "light";
}

export function setTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  listeners.forEach((listener) => listener());
}

export function subscribeToTheme(listener: ThemeListener): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
