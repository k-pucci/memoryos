import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Memory,
  getMemoryTypeIcon,
  getMemoryTypeClass,
  processMemoryContent,
  formatMemoryDate,
} from "@/lib/memory-utils";

interface MemoryCardProps {
  memory: Memory;
  onClick: (id: string) => void;
  variant?: "default" | "compact"; // Handle any future variations
}

export function MemoryCard({
  memory,
  onClick,
  variant = "default",
}: MemoryCardProps) {
  const { content, items } = processMemoryContent(memory);
  const memoryClass = getMemoryTypeClass(memory.memory_type, memory.category);

  const handleClick = () => {
    onClick(memory.id);
  };

  return (
    <Card
      className={cn(
        "bg-card border-border overflow-hidden relative group hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer card-shadow hover:card-shadow-lg"
      )}
      onClick={handleClick}
    >
      {/* Top accent line */}
      <div
        className={`absolute top-0 left-0 w-full h-1 ${memoryClass}-bg`}
      ></div>

      <CardContent className="p-4 pt-5">
        {/* Header section - category badge and timestamp */}
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="flex items-center gap-2 flex-shrink min-w-0">
            <div className={`${memoryClass} opacity-70`}>
              {getMemoryTypeIcon(memory.memory_type)}
            </div>
            <span
              className={cn(
                "text-xs px-2 py-1 rounded-full font-medium truncate",
                `${memoryClass}-bg ${memoryClass}`
              )}
            >
              {memory.category}
            </span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground gap-1 flex-shrink-0 whitespace-nowrap">
            <Clock size={12} />
            <span>{formatMemoryDate(memory.created_at)}</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="font-semibold text-foreground mb-2 line-clamp-2 transition-colors">
          {memory.title}
        </h2>

        {/* Content */}
        {content && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-2 transition-colors">
            {content}
          </p>
        )}

        {/* Items (bullet points) */}
        {items && items.length > 0 && (
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-1 space-y-1 transition-colors mb-2">
            {items.slice(0, 2).map((item: string, index: number) => (
              <li key={index} className="line-clamp-1">
                {item}
              </li>
            ))}
            {items.length > 2 && (
              <li className="text-muted-foreground/80">
                +{items.length - 2} more items
              </li>
            )}
          </ul>
        )}

        {/* Tags (if they exist and no items to save space) */}
        {memory.tags && memory.tags.length > 0 && !items.length && (
          <div className="flex flex-wrap gap-1 mb-2">
            {memory.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md font-medium"
              >
                {tag}
              </span>
            ))}
            {memory.tags.length > 2 && (
              <span className="text-xs text-muted-foreground font-medium">
                +{memory.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Bottom right hover arrow */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={16} className="text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
