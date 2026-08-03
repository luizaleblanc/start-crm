import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type BadgeVariant = "default" | "success" | "muted";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  muted: "bg-muted-foreground/10 text-muted-foreground",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
