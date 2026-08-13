import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-foreground/10 animate-pulse rounded-md", className)} {...props} />;
}
