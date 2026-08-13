"use client";

import { Moon, Sun } from "lucide-react";
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
        "fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition-opacity hover:opacity-80",
      )}
    >
      {isDark ? <Sun aria-hidden size={16} /> : <Moon aria-hidden size={16} />}
    </button>
  );
}
