// components/ui/select.tsx

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function Select({
  name,
  value,
  onChange,
  options,
  className,
  placeholder = "Select...",
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(() => {
    const selected = options.find((option) => option.value === value);
    return selected ? selected.label : placeholder;
  });

  // Update selected label when value changes externally
  useEffect(() => {
    const selected = options.find((option) => option.value === value);
    setSelectedLabel(selected ? selected.label : placeholder);
  }, [value, options, placeholder]);

  const handleSelect = (optionValue: string, optionLabel: string) => {
    if (disabled) return;

    onChange(optionValue);
    setSelectedLabel(optionLabel);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (name && !target.closest(`[data-select="${name}"]`)) {
        setIsOpen(false);
      } else if (!name && !target.closest("[data-select]")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, name]);

  return (
    <div className="relative" data-select={name || "select"}>
      <button
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className={cn(
          "w-full h-10 px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "cursor-pointer transition-all text-left",
          "hover:border-primary/50",
          isOpen && "border-primary ring-2 ring-primary/20",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value, option.label)}
              className={cn(
                "w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors",
                "focus:outline-none focus:bg-muted",
                option.value === value &&
                  "bg-primary/10 text-primary font-medium"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
