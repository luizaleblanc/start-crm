import type { ReactNode } from "react";

interface TopbarProps {
  title?: string;
  actions?: ReactNode;
}

export function Topbar({ title, actions }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background pl-6 pr-16">
      {title && <h1 className="text-h5 text-foreground">{title}</h1>}
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
