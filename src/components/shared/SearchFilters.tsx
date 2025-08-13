// components/shared/SearchFilters.tsx

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectOption } from "@/components/ui/select";
import { X, Calendar, Tag } from "lucide-react";
import { MEMORY_CATEGORIES } from "@/lib/memory-utils";

export interface FilterState {
  category: string | null;
  memory_type: string | null;
  tags: string[];
  date_from: string | null;
  date_to: string | null;
}

interface SearchFiltersProps {
  filters: FilterState;
  availableTags: string[];
  onFiltersChange: (filters: FilterState) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  showCategories?: boolean;
  showMemoryTypes?: boolean;
  showTags?: boolean;
  showDateRange?: boolean;
  // New props for configurability
  title?: string;
  variant?: "modal" | "embedded";
  showBorder?: boolean;
  showHeader?: boolean; // Control whether to show the header
  showActions?: boolean; // Control whether to show action buttons
}

export function SearchFilters({
  filters,
  availableTags,
  onFiltersChange,
  onApply,
  onClear,
  onClose,
  showCategories = true,
  showMemoryTypes = true,
  showTags = true,
  showDateRange = true,
  // New props with defaults
  title = "Advanced Filters",
  variant = "modal",
  showBorder = true,
  showHeader = true, // Show header by default
  showActions = true, // Show actions by default
}: SearchFiltersProps) {
  // Category options
  const categoryOptions: SelectOption[] = [
    { value: "", label: "All Categories" },
    ...MEMORY_CATEGORIES.slice(1).map((category) => ({
      value: category,
      label: category,
    })),
  ];

  // Memory type options
  const memoryTypeOptions: SelectOption[] = [
    { value: "", label: "All Types" },
    { value: "note", label: "Note" },
    { value: "concept", label: "Concept" },
    { value: "document", label: "Document" },
    { value: "link", label: "Link" },
    { value: "event", label: "Event" },
    { value: "analysis", label: "Analysis" },
  ];

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];

    onFiltersChange({ ...filters, tags: newTags });
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = () => {
    return (
      filters.category ||
      filters.memory_type ||
      filters.tags.length > 0 ||
      filters.date_from ||
      filters.date_to
    );
  };

  // Conditional wrapper based on variant
  const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    if (variant === "embedded") {
      return (
        <div className={`bg-card p-4 rounded-lg ${showBorder ? "border" : ""}`}>
          {children}
        </div>
      );
    }

    // Default modal variant uses Card
    return (
      <Card className={`card-shadow ${!showBorder ? "border-0" : ""}`}>
        <CardContent className="p-4 space-y-4">{children}</CardContent>
      </Card>
    );
  };

  const content = (
    <>
      {/* Conditional Header */}
      {showHeader && (
        <div className="flex justify-between items-center">
          <h3 className="text-foreground font-medium">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      )}

      {/* Category and Memory Type */}
      {(showCategories || showMemoryTypes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showCategories && (
            <div className="space-y-2">
              <label className="text-sm text-foreground">Category</label>
              <Select
                name="category"
                value={filters.category || ""}
                onChange={(value) => updateFilter("category", value || null)}
                options={categoryOptions}
                placeholder="All Categories"
              />
            </div>
          )}

          {showMemoryTypes && (
            <div className="space-y-2">
              <label className="text-sm text-foreground">Memory Type</label>
              <Select
                name="memory_type"
                value={filters.memory_type || ""}
                onChange={(value) => updateFilter("memory_type", value || null)}
                options={memoryTypeOptions}
                placeholder="All Types"
              />
            </div>
          )}
        </div>
      )}

      {/* Tags Filter */}
      {showTags && availableTags.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm text-foreground flex items-center gap-2">
            <Tag size={14} />
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.slice(0, 20).map((tag) => (
              <Button
                key={tag}
                variant={filters.tags.includes(tag) ? "default" : "secondary"}
                size="sm"
                onClick={() => toggleTag(tag)}
                className="h-auto py-1 px-2 text-xs rounded-full"
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Date Range */}
      {showDateRange && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-foreground flex items-center gap-2">
              <Calendar size={14} />
              From Date
            </label>
            <DatePicker
              value={filters.date_from || ""}
              onChange={(value) => updateFilter("date_from", value)}
              placeholder="Select start date"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-foreground flex items-center gap-2">
              <Calendar size={14} />
              To Date
            </label>
            <DatePicker
              value={filters.date_to || ""}
              onChange={(value) => updateFilter("date_to", value)}
              placeholder="Select end date"
            />
          </div>
        </div>
      )}

      {/* Conditional Action Buttons */}
      {showActions && (
        <div className="flex justify-end space-x-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            onClick={onClear}
            disabled={!hasActiveFilters()}
          >
            Clear Filters
          </Button>
          <Button onClick={onApply}>Apply Filters</Button>
        </div>
      )}
    </>
  );

  return (
    <ContentWrapper>
      {variant === "embedded" ? (
        <div className="space-y-4">{content}</div>
      ) : (
        content
      )}
    </ContentWrapper>
  );
}
