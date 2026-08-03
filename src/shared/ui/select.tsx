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
          <label htmlFor={selectId} className="text-caption font-medium text-foreground">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-10 rounded-md border border-border bg-background px-3 text-body text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-caption text-red-500">{error}</span>}
      </div>
    );
  },
);

Select.displayName = "Select";
