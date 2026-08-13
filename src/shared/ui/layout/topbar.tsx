import { Bell, Search } from "lucide-react";
import type { ReactNode } from "react";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  search?: boolean;
  notifications?: boolean;
}

export function Topbar({ title, subtitle, actions, search, notifications }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background pl-6 pr-6">
      <div className="flex min-w-0 flex-col justify-center">
        {title && <h1 className="text-h5 text-foreground">{title}</h1>}
        {subtitle && <p className="text-caption text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {search && (
          <div className="relative hidden sm:block">
            <Search
              aria-hidden
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Buscar lead…"
              disabled
              className="h-9 w-56 rounded-md border border-border bg-background pl-9 pr-3 text-body text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
          </div>
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
