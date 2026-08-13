"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, type, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const isPassword = type === "password";
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-h6 uppercase text-muted-foreground">
            {label}
          </label>
        )}
        <div className={cn("relative", className)}>
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            className={cn(
              "h-10 w-full rounded-md border border-border bg-background px-3 text-body text-foreground",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive",
              isPassword && "pr-10",
            )}
            aria-invalid={Boolean(error)}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff aria-hidden size={18} /> : <Eye aria-hidden size={18} />}
            </button>
          )}
        </div>
        {error && <span className="text-caption text-destructive">{error}</span>}
      </div>
    );
  },
);

Input.displayName = "Input";
