import { ChevronDown } from "lucide-react";
import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "./cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-h6 uppercase text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "h-10 w-full appearance-none rounded-md border border-border bg-background px-3 pr-9 text-body text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive",
              className,
            )}
            aria-invalid={Boolean(error)}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            aria-hidden
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>
        {error && <span className="text-caption text-destructive">{error}</span>}
      </div>
    );
  },
);

Select.displayName = "Select";
