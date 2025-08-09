// lib/theme-utils.ts
import React from "react";
import {
  Edit,
  FileText,
  Globe,
  BarChart3,
  Puzzle,
  Calendar,
  Microscope,
  Rocket,
  GraduationCap,
  Lightbulb,
  CheckSquare,
  Archive,
} from "lucide-react";

// Memory type definitions
export type MemoryType =
  | "research"
  | "product"
  | "meeting"
  | "learning"
  | "idea"
  | "task"
  | "note"
  | "document"
  | "link"
  | "analysis"
  | "concept"
  | "event";

// Icon mapping for memory types - returns the component, not JSX
export const getMemoryTypeIconComponent = (memoryType: string) => {
  const iconMap: { [key: string]: React.ComponentType<{ size: number }> } = {
    note: Edit,
    document: FileText,
    link: Globe,
    analysis: BarChart3,
    concept: Puzzle,
    event: Calendar,
    research: Microscope,
    product: Rocket,
    meeting: Calendar,
    learning: GraduationCap,
    idea: Lightbulb,
    task: CheckSquare,
  };

  return iconMap[memoryType.toLowerCase()] || Archive;
};

// Helper function that returns JSX for use in components
export const getMemoryTypeIcon = (memoryType: string, size: number = 16) => {
  const IconComponent = getMemoryTypeIconComponent(memoryType);
  return React.createElement(IconComponent, { size });
};

// Get CSS class for memory type styling
export const getMemoryTypeClass = (
  memoryType: string,
  category?: string
): string => {
  const type = memoryType.toLowerCase();
  const cat = category?.toLowerCase();

  // Available memory type classes (must match your CSS)
  const memoryTypes: MemoryType[] = [
    "research",
    "product",
    "meeting",
    "learning",
    "idea",
    "task",
    "note",
    "document",
    "link",
    "analysis",
    "concept",
    "event",
  ];

  if (memoryTypes.includes(type as MemoryType)) {
    return `memory-${type}`;
  } else if (cat && memoryTypes.includes(cat as MemoryType)) {
    return `memory-${cat}`;
  }

  return "memory-note"; // fallback
};

// Get background class for memory type
export const getMemoryTypeBgClass = (
  memoryType: string,
  category?: string
): string => {
  const baseClass = getMemoryTypeClass(memoryType, category);
  return `${baseClass}-bg`;
};

// Get border class for memory type
export const getMemoryTypeBorderClass = (
  memoryType: string,
  category?: string
): string => {
  const baseClass = getMemoryTypeClass(memoryType, category);
  return `${baseClass}-border`;
};

// Emoji mapping for memory types (for visual variety)
export const getMemoryTypeEmoji = (memoryType: string): string => {
  const emojiMap: { [key: string]: string } = {
    note: "📝",
    document: "📄",
    link: "🔗",
    analysis: "📊",
    concept: "🧩",
    event: "📅",
    research: "🔬",
    product: "🚀",
    meeting: "👥",
    learning: "🎓",
    idea: "💡",
    task: "✅",
  };

  return emojiMap[memoryType.toLowerCase()] || "📋";
};

// Memory type display names (for consistent labeling)
export const getMemoryTypeDisplayName = (memoryType: string): string => {
  const displayNames: { [key: string]: string } = {
    note: "Note",
    document: "Document",
    link: "Link",
    analysis: "Analysis",
    concept: "Concept",
    event: "Event",
    research: "Research",
    product: "Product",
    meeting: "Meeting",
    learning: "Learning",
    idea: "Idea",
    task: "Task",
  };

  return displayNames[memoryType.toLowerCase()] || memoryType;
};

// Theme-aware utility classes
export const themeClasses = {
  // Card styles
  card: "bg-card border-border card-shadow hover:card-shadow-lg",
  cardHover: "hover:border-primary/30 transition-all",

  // Button styles
  primaryButton:
    "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all",
  secondaryButton:
    "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",

  // Input styles
  input:
    "bg-card border-border focus:border-primary focus:ring focus:ring-primary/20",

  // Text styles
  heading: "text-foreground font-semibold",
  body: "text-foreground",
  muted: "text-muted-foreground",

  // Chip/Tag styles
  chip: "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  chipActive: "bg-primary text-primary-foreground",

  // Search dropdown
  dropdown: "bg-popover border-border card-shadow-lg",
  dropdownItem: "hover:bg-accent",
} as const;

// Memory priority levels (for future features)
export const memoryPriorities = {
  low: { label: "Low", class: "text-muted-foreground", bg: "bg-muted" },
  medium: { label: "Medium", class: "text-foreground", bg: "bg-secondary" },
  high: { label: "High", class: "text-primary", bg: "bg-primary/10" },
  urgent: {
    label: "Urgent",
    class: "text-destructive",
    bg: "bg-destructive/10",
  },
} as const;

export type MemoryPriority = keyof typeof memoryPriorities;
