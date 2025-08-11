import React from "react";
import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  className?: string;
}

export function ViewToggle({
  viewMode,
  onViewModeChange,
  className,
}: ViewToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-muted rounded-lg p-1",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9",
          viewMode === "grid"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:text-foreground hover:bg-background"
        )}
        onClick={() => onViewModeChange("grid")}
        aria-label="Grid view"
      >
        <Grid3X3 size={16} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9",
          viewMode === "list"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:text-foreground hover:bg-background"
        )}
        onClick={() => onViewModeChange("list")}
        aria-label="List view"
      >
        <List size={16} />
      </Button>
    </div>
  );
}
