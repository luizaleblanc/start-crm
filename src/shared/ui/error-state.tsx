import { AlertTriangle } from "lucide-react";
import { cn } from "./cn";

interface ErrorStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function ErrorState({
  title = "Não foi possível carregar os dados",
  description = "Tente novamente em instantes.",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-2 rounded-md border px-6 py-10 text-center",
        className,
      )}
    >
      <AlertTriangle aria-hidden size={28} className="text-destructive" />
      <p className="text-body font-medium text-foreground">{title}</p>
      <p className="text-caption text-muted-foreground">{description}</p>
    </div>
  );
}
