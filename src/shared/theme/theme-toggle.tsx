"use client";

import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/shared/ui/cn";
import { getServerTheme, getTheme, setTheme, subscribeToTheme } from "./theme-store";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, getServerTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-border shadow-sm transition-colors",
        isDark ? "bg-white hover:bg-white/90" : "hover:bg-foreground/5 bg-background",
      )}
    >
      {isDark ? (
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="#193073">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      ) : (
        <svg
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="4.5" fill="#f59e0b" stroke="none" />
          <path d="M12 2.5v2M12 19.5v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2.5 12h2M19.5 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      )}
    </button>
  );
}
