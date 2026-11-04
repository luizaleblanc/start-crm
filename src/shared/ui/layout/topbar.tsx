"use client";

import { Bell, Search, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  search?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  searchPlaceholder?: string;
  notifications?: boolean;
}

export function Topbar({
  title,
  subtitle,
  actions,
  search,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder,
  notifications,
}: TopbarProps) {
  const [internalValue, setInternalValue] = useState("");
  const currentQuery = searchValue !== undefined ? searchValue : internalValue;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSearchSubmit?.(currentQuery);
  }

  function handleChange(value: string) {
    setInternalValue(value);
    onSearchChange?.(value);
  }

  function handleClear() {
    setInternalValue("");
    onSearchChange?.("");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background pl-6 pr-6">
      <div className="flex min-w-0 flex-col justify-center">
        {title && <h1 className="text-h5 text-foreground">{title}</h1>}
        {subtitle && <p className="text-caption text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {search && (
          <form onSubmit={handleSubmit} className="relative hidden sm:block">
            <Search
              aria-hidden
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={currentQuery}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={searchPlaceholder ?? "Buscar lead…"}
              className="h-9 w-64 rounded-md border border-border bg-background pl-9 pr-8 text-body text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {currentQuery && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Limpar busca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </form>
        )}
        {notifications && (
          <button
            type="button"
            disabled
            aria-label="Notificações"
            className="relative flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-border text-muted-foreground"
          >
            <Bell aria-hidden size={16} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>
        )}
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
