// src/components/ui/textarea.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[80px] w-full rounded-md border border-border bg-background text-foreground px-3 py-2",
          "placeholder:text-muted-foreground",
          "focus:border-primary focus:ring focus:ring-primary/20 focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "resize-vertical",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
