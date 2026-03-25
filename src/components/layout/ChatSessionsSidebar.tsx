// components/layout/ChatSessionsSidebar.tsx - Simplified with extracted ChatSessionItem
"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

function ChatSessionsSidebarContent({
  isVisible,
  currentSessionId: propSessionId,
  onSessionSelect,
  onNewChat,
  onSessionDeleted
}: ChatSessionsSidebarProps) {
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("session");
  // Use URL session ID if available, fall back to prop
  const currentSessionId = urlSessionId || propSessionId;

  const { sessions, loading, deleteSession } = useChatSessions(isVisible, currentSessionId);

  const handleNewChat = () => {
    // If already on a clean chat page (no session), do nothing
    if (!currentSessionId) return;

    // Don't create a session yet - just navigate to empty chat
    // Session will be created when user sends first message with proper title
    onNewChat("");
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

export function ChatSessionsSidebar(props: ChatSessionsSidebarProps) {
  if (!props.isVisible) return null;

  return (
    <Suspense fallback={
      <div className="flex flex-col space-y-1 mt-4 flex-1 min-h-0">
        <Button
          variant="ghost"
          disabled
          className="justify-start text-sidebar-foreground/70 px-3 py-2 h-auto"
        >
          <Plus size={16} className="mr-3 flex-shrink-0" />
          <span className="text-sm">New Chat</span>
        </Button>
        <div className="px-3 py-2 text-xs text-sidebar-foreground/50">
          Loading chats...
        </div>
      </div>
    }>
      <ChatSessionsSidebarContent {...props} />
    </Suspense>
  );
}
