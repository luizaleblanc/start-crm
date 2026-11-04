"use client";

import { Bell, Calendar, Search, Settings, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { ThemeToggle } from "@/shared/theme/theme-toggle";

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
  search = true,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder,
  notifications = true,
}: TopbarProps) {
  const [internalValue, setInternalValue] = useState("");
  const currentQuery = searchValue !== undefined ? searchValue : internalValue;

  const todayFormatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

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
    <header className="h-20 mt-3 border-border/80 bg-background/90 flex shrink-0 items-center justify-between gap-4 px-8 backdrop-blur-sm">
      {/* Lado Esquerdo: Busca e Data no estilo do Dashboard de Referência */}
      <div className="flex items-center gap-4">
        {search && (
          <form onSubmit={handleSubmit} className="relative w-64 sm:w-80">
            <Search
              aria-hidden
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={currentQuery}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={searchPlaceholder ?? "Buscar no CRM..."}
              className="border-border/80 bg-card/60 shadow-xs h-10 w-full rounded-full border pl-9 pr-8 text-caption text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {currentQuery && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </form>
        )}

        <div className="border-border/60 bg-card/40 hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-medium text-muted-foreground lg:flex">
          <Calendar size={13} className="text-primary" />
          <span className="capitalize">{todayFormatted}</span>
        </div>
      </div>

      {/* Lado Direito: Ações, Tema, Notificações - Perfeitamente alinhados e espaçados */}
      <div className="flex items-center gap-3">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Botão de Alternância de Tema (Light / Dark) */}
        <ThemeToggle />

        {/* Botão de Notificações com Ping */}
        {notifications && (
          <button
            type="button"
            aria-label="Notificações"
            title="Notificações"
            className="border-border/80 shadow-xs hover:bg-muted relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bell aria-hidden size={16} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-card" />
          </button>
        )}
      </div>
    </header>
  );
}
