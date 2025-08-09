// src/components/ui/button.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "default",
      children,
      className = "",
      ...props
    },
    ref
  ) => {
    const getVariantClasses = () => {
      switch (variant) {
        case "outline":
          return "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground";
        case "ghost":
          return "text-foreground hover:bg-accent hover:text-accent-foreground";
        case "secondary":
          return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
        case "destructive":
          return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
        default:
          return "bg-primary text-primary-foreground hover:bg-primary/90";
      }
    };

    const getSizeClasses = () => {
      switch (size) {
        case "sm":
          return "px-3 py-1.5 text-sm h-8";
        case "lg":
          return "px-6 py-3 text-lg h-12";
        case "icon":
          return "p-2 h-9 w-9";
        default:
          return "px-4 py-2 h-10";
      }
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          getVariantClasses(),
          getSizeClasses(),
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
