// components/layout/ChatSessionsSidebar.tsx - Simplified with extracted ChatSessionItem
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useChatSessions } from "@/hooks/useChatSessions";
import { ChatSessionItem } from "@/components/ui/chat-session-item";

interface ChatSessionsSidebarProps {
  isVisible: boolean;
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: (sessionId: string) => void;
  onSessionDeleted: (sessionId: string) => void;
}

export function ChatSessionsSidebar({ 
  isVisible, 
  currentSessionId, 
  onSessionSelect, 
  onNewChat,
  onSessionDeleted 
}: ChatSessionsSidebarProps) {
  const { sessions, loading, createSession, deleteSession } = useChatSessions(isVisible);

  const handleNewChat = async () => {
    const sessionId = await createSession();
    if (sessionId) {
      onNewChat(sessionId);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    onSessionDeleted(sessionId);
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col space-y-1 mt-4 flex-1 min-h-0">
      <Button
        variant="ghost"
        onClick={handleNewChat}
        className="justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent px-3 py-2 h-auto"
      >
        <Plus size={16} className="mr-3 flex-shrink-0" />
        <span className="text-sm">New Chat</span>
      </Button>

      {loading ? (
        <div className="px-3 py-2 text-xs text-sidebar-foreground/50">
          Loading chats...
        </div>
      ) : sessions.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
          {sessions.map((session) => (
            <ChatSessionItem
              key={session.id}
              session={session}
              active={currentSessionId === session.id}
              onSelect={onSessionSelect}
              onDelete={handleDeleteSession}
            />
          ))}
        </div>
      ) : (
        <div className="px-3 py-2 text-xs text-sidebar-foreground/50">
          No previous chats
        </div>
      )}
    </div>
  );
}
