import { cn } from "./cn";

interface AvatarProps {
  name: string;
  size?: "sm" | "md";
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-caption",
};

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "bg-primary/10 flex shrink-0 items-center justify-center rounded-full font-semibold text-primary",
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  );
}
