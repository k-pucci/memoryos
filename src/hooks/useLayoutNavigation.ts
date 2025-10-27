// hooks/useLayoutNavigation.ts - Extract navigation logic
"use client";

import { useRouter } from "next/navigation";
import { performMemorySearch } from "@/lib/search-utils";
import { SearchResult } from "@/components/ui/search-bar";

export function useLayoutNavigation() {
  const router = useRouter();

  const navigateTo = (path: string) => router.push(path);

  const handleChatSessionSelect = (sessionId: string, onSessionChange?: (id: string) => void) => {
    onSessionChange?.(sessionId);
    router.push(`/chat?session=${sessionId}`);
  };

  const handleNewChat = (sessionId: string, onSessionChange?: (id: string) => void) => {
    onSessionChange?.(sessionId);
    router.push(`/chat?session=${sessionId}`);
  };

  const handleChatSessionDeleted = (sessionId: string, currentSessionId?: string) => {
    if (currentSessionId === sessionId) {
      router.push('/chat');
    }
  };

  const searchMemories = async (query: string): Promise<SearchResult[]> => {
    try {
      const results = await performMemorySearch(query, 5);
      return results.map((memory) => ({
        id: memory.id,
        title: memory.title,
        content: memory.content,
        summary: memory.summary,
        created_at: memory.created_at,
        memory_type: memory.memory_type,
        category: memory.category,
      }));
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigateTo(`/memory/${result.id}`);
  };

  const handleViewAllResults = (query: string) => {
    router.push(`/library?q=${encodeURIComponent(query)}`);
  };

  return {
    navigateTo,
    handleChatSessionSelect,
    handleNewChat,
    handleChatSessionDeleted,
    searchMemories,
    handleResultClick,
    handleViewAllResults,
  };
}