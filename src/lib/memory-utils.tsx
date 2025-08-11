import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Edit,
  Globe,
  FileText,
  Calendar,
  Archive,
  Lightbulb,
  CheckSquare,
  BarChart3,
  Puzzle,
  Rocket,
  GraduationCap,
  Microscope,
} from "lucide-react";

// Memory interface - shared across all pages
export interface Memory {
  id: string;
  title: string;
  category: string;
  memory_type: string;
  content: string;
  summary?: string;
  tags?: string[];
  source_url?: string;
  created_at: string;
  updated_at: string;
  similarity?: number; // for search results
}

// Extended interface for search results
export interface MemoryResult extends Memory {
  similarity: number;
}

// Memory categories - used across multiple pages
export const MEMORY_CATEGORIES = [
  "All",
  "Research",
  "Product",
  "Meeting",
  "Learning",
  "Idea",
  "Task",
  "Note",
  "Document",
  "Link",
  "Analysis",
  "Concept",
  "Event",
];

// Memory type to icon mapping - IDENTICAL in all 3 files
export const getMemoryTypeIcon = (memoryType: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    note: <Edit size={14} />,
    document: <FileText size={14} />,
    link: <Globe size={14} />,
    analysis: <BarChart3 size={14} />,
    concept: <Puzzle size={14} />,
    event: <Calendar size={14} />,
    research: <Microscope size={14} />,
    product: <Rocket size={14} />,
    meeting: <Calendar size={14} />,
    learning: <GraduationCap size={14} />,
    idea: <Lightbulb size={14} />,
    task: <CheckSquare size={14} />,
  };

  return iconMap[memoryType.toLowerCase()] || <Archive size={14} />;
};

// Memory type CSS class - IDENTICAL in home and library
export const getMemoryTypeClass = (memoryType: string, category: string) => {
  const type = memoryType.toLowerCase();
  const cat = category.toLowerCase();

  const memoryTypes = [
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

  if (memoryTypes.includes(type)) {
    return `memory-${type}`;
  } else if (memoryTypes.includes(cat)) {
    return `memory-${cat}`;
  }

  return "memory-note"; // fallback
};

// Content processing - IDENTICAL logic in home and library
export const processMemoryContent = (
  memory: Memory
): { content: string; items: string[] } => {
  const lines = memory.content.split("\n");
  const bulletPattern = /^[-*•]\s+(.+)$/;

  const items: string[] = [];
  let regularContent = "";

  lines.forEach((line) => {
    const match = line.match(bulletPattern);
    if (match && match[1]) {
      items.push(match[1].trim());
    } else if (line.trim()) {
      regularContent += line + " ";
    }
  });

  return {
    content: regularContent.trim() || memory.summary || "",
    items: items,
  };
};

// Date formatting - used in multiple places
export const formatMemoryDate = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true }).replace(
    "about ",
    ""
  );
};
