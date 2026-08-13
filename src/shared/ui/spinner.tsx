import { Loader2 } from "lucide-react";
import { cn } from "./cn";

interface SpinnerProps {
  className?: string;
  size?: number;
}

export function Spinner({ className, size = 16 }: SpinnerProps) {
  return <Loader2 aria-hidden size={size} className={cn("animate-spin", className)} />;
}
