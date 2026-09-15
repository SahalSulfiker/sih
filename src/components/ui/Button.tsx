"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-marine-700 text-white border border-marine-700 hover:bg-marine-900 hover:border-marine-900 disabled:bg-ink-300 disabled:border-ink-300",
  secondary:
    "bg-white text-ink-900 border border-border-strong hover:border-marine-500 hover:text-marine-700 disabled:text-ink-300 disabled:border-border",
  ghost:
    "bg-transparent text-ink-500 border border-transparent hover:text-ink-900 hover:bg-ink-900/5 disabled:text-ink-300",
};

const sizeClasses: Record<Size, string> = {
  md: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-[13px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 ease-out disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
