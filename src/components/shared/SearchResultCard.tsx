// components/shared/SearchResultCard.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MemoryResult,
  getMemoryTypeIcon,
  formatMemoryDate,
} from "@/lib/memory-utils";

interface SearchResultCardProps {
  memory: MemoryResult;
  onClick: (id: string) => void;
}

export function SearchResultCard({ memory, onClick }: SearchResultCardProps) {
  // Helper function for similarity display colors
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9)
      return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
    if (similarity >= 0.8)
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
    if (similarity >= 0.7)
      return "bg-purple-500/20 text-purple-600 dark:text-purple-400";
    if (similarity >= 0.6)
      return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
    return "bg-red-500/20 text-red-600 dark:text-red-400";
  };

  const handleSourceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (memory.source_url) {
      window.open(memory.source_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card
      className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer card-shadow hover:card-shadow-lg"
      onClick={() => onClick(memory.id)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with title and similarity score */}
          <div className="flex justify-between items-start gap-3">
            <h3 className="text-xl font-semibold text-foreground line-clamp-2 flex-1">
              {memory.title}
            </h3>

            {/* Similarity score badge */}
            {memory.similarity < 1 && (
              <div
                className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium shrink-0",
                  getSimilarityColor(memory.similarity)
                )}
              >
                {Math.round(memory.similarity * 100)}% match
              </div>
            )}
          </div>

          {/* Summary/Content preview */}
          <p className="text-muted-foreground line-clamp-3">
            {memory.summary ||
              memory.content.substring(0, 150) +
                (memory.content.length > 150 ? "..." : "")}
          </p>

          {/* Tags */}
          {memory.tags && memory.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {memory.tags.slice(0, 4).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {memory.tags.length > 4 && (
                <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                  +{memory.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Footer with metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {getMemoryTypeIcon(memory.memory_type)}
                <span className="capitalize">{memory.memory_type}</span>
              </div>

              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                {memory.category}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs">
                {formatMemoryDate(memory.created_at)}
              </span>

              {memory.source_url && (
                <button
                  onClick={handleSourceClick}
                  className="text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Source</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
