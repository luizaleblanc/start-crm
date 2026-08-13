import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border px-6 py-10 text-center",
        className,
      )}
    >
      <Icon aria-hidden size={28} className="text-muted-foreground" />
      <p className="text-body font-medium text-foreground">{title}</p>
      {description && <p className="text-caption text-muted-foreground">{description}</p>}
    </div>
  );
}
