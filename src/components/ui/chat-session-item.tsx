// components/ui/chat-session-item.tsx - Extract chat session item
"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { formatChatTime } from "@/lib/layout-utils";

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
  onDelete: (sessionId: string) => void;
}

export function ChatSessionItem({ session, active, onSelect, onDelete }: ChatSessionItemProps) {
  const [showActions, setShowActions] = useState(false);

  const handleClick = () => onSelect(session.id);
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(session.id);
  };

  const containerClasses = `group relative px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
    active
      ? "bg-sidebar-primary/10 text-sidebar-primary"
      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
  }`;

  return (
    <div
      className={containerClasses}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between min-w-0">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {session.title}
          </div>
          <div className="text-xs text-sidebar-foreground/50 mt-0.5">
            {formatChatTime(session.updated_at)}
          </div>
        </div>

        {showActions && (
          <button
            onClick={handleDelete}
            className="ml-2 p-1 rounded hover:bg-sidebar-foreground/10 text-sidebar-foreground/50 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}