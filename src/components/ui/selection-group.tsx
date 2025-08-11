// components/ui/selection-group.tsx

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SelectionOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface SelectionGroupProps {
  options: SelectionOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  variant?: "buttons" | "grid" | "list";
  size?: "sm" | "md" | "lg";
  columns?: number;
  className?: string;
}

export function SelectionGroup({
  options,
  value,
  onChange,
  label,
  variant = "buttons",
  size = "md",
  columns = 3,
  className,
}: SelectionGroupProps) {
  const getButtonSize = () => {
    switch (size) {
      case "sm":
        return "sm";
      case "lg":
        return "lg";
      default:
        return "default";
    }
  };

  const getGridCols = () => {
    switch (columns) {
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2 md:grid-cols-3";
      case 4:
        return "grid-cols-2 md:grid-cols-4";
      default:
        return "grid-cols-2 md:grid-cols-3";
    }
  };

  const renderOption = (option: SelectionOption) => (
    <Button
      key={option.value}
      type="button"
      variant={value === option.value ? "default" : "outline"}
      size={getButtonSize()}
      onClick={() => onChange(option.value)}
      className={cn(
        variant === "grid" && "justify-start",
        variant === "list" && "justify-start w-full"
      )}
    >
      {option.icon && (
        <div className="flex items-center justify-center w-4 h-4 mr-2">
          {option.icon}
        </div>
      )}
      <div className="flex flex-col items-start">
        <span
          className={cn(
            variant === "buttons" && "capitalize",
            variant === "grid" && "capitalize"
          )}
        >
          {option.label}
        </span>
        {option.description && variant !== "buttons" && (
          <span className="text-xs text-muted-foreground">
            {option.description}
          </span>
        )}
      </div>
    </Button>
  );

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      {variant === "buttons" && (
        <div className="flex flex-wrap gap-2">{options.map(renderOption)}</div>
      )}

      {variant === "grid" && (
        <div className={cn("grid gap-3", getGridCols())}>
          {options.map(renderOption)}
        </div>
      )}

      {variant === "list" && (
        <div className="space-y-2">{options.map(renderOption)}</div>
      )}
    </div>
  );
}
