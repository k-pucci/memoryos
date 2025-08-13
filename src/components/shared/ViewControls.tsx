// components/shared/ViewControls.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Grid3X3, List, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewControlsProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount?: number;
  className?: string;
}

export function ViewControls({
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount = 0,
  className,
}: ViewControlsProps) {
  return (
    <div className={cn("flex items-center bg-muted rounded-lg p-1", className)}>
      {/* Filter Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 relative",
          showFilters
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:text-foreground hover:bg-background"
        )}
        onClick={onToggleFilters}
        aria-label="Toggle filters"
      >
        <Filter size={16} />
        {activeFiltersCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
            {activeFiltersCount}
          </span>
        )}
      </Button>

      {/* Divider */}
      <div className="w-px h-6 bg-border mx-1" />

      {/* View Mode Buttons Container */}
      <div className="flex items-center gap-1">
        {/* Grid View Button */}
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

        {/* List View Button */}
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
    </div>
  );
}
