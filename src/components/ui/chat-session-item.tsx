// components/ui/chat-session-item.tsx - Extract chat session item
"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { formatChatTime } from "@/lib/layout-utils";
import { cn } from "@/lib/utils";

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

interface ChatSessionItemProps {
  session: ChatSession;
  active: boolean;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => Promise<void> | void;
}

export function ChatSessionItem({ session, active, onSelect, onDelete }: ChatSessionItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClick = () => onSelect(session.id);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete(session.id);
    // Note: Component will unmount after deletion, so no need to reset state
  };

  return (
    <div
      className={cn(
        "group relative px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
        active
          ? "bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/20"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between min-w-0">
        <div className="flex-1 min-w-0">
          <div className={cn(
            "text-sm truncate",
            active ? "font-medium" : "font-normal"
          )}>
            {session.title}
          </div>
          <div className={cn(
            "text-xs mt-0.5",
            active ? "text-sidebar-primary/60" : "text-sidebar-foreground/50"
          )}>
            {formatChatTime(session.updated_at)}
          </div>
        </div>

        {(showActions || isDeleting) && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="ml-2 p-1 rounded hover:bg-sidebar-foreground/10 text-sidebar-foreground/50 hover:text-destructive transition-colors cursor-pointer disabled:cursor-default"
          >
            {isDeleting ? (
              <div className="w-3 h-3 border-2 border-sidebar-foreground/30 border-t-sidebar-foreground/70 rounded-full animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}