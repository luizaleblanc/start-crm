import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-caption font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 rounded-md border border-border bg-background px-3 text-body text-foreground",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error && <span className="text-caption text-red-500">{error}</span>}
      </div>
    );
  },
);

Input.displayName = "Input";
