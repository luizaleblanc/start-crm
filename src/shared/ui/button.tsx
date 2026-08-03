import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
  outline: "border border-border bg-transparent text-foreground hover:bg-foreground/5",
  ghost: "bg-transparent text-foreground hover:bg-foreground/5",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-caption",
  md: "h-10 px-4 text-body",
  lg: "h-12 px-6 text-body",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
