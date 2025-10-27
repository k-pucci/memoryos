// components/layout/Layout.tsx - Simplified main layout
"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useLayoutNavigation } from "@/hooks/useLayoutNavigation";
import { SidebarHeader } from "@/components/layout/SidebarHeader";
import { NavigationSection } from "@/components/layout/NavigationSection";
import { ChatSessionsSidebar } from "@/components/layout/ChatSessionsSidebar";
import { UserProfileSection } from "@/components/layout/UserProfileSection";
import { LayoutHeader } from "@/components/layout/LayoutHeader";
import {
  MemoryResult,
  getMemoryTypeIcon,
  formatMemoryDate,
} from "@/lib/memory-utils";
import { SearchResult } from "@/components/ui/search-bar";

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  scrollMode?: "page" | "container";
  contentPadding?: boolean;
  currentChatSession?: string;
  onChatSessionChange?: (sessionId: string) => void;
}

export default function Layout({
  children,
  currentPage = "Home",
  scrollMode = "page",
  contentPadding = true,
  currentChatSession,
  onChatSessionChange,
}: LayoutProps) {
  const { isCollapsed, toggle: toggleSidebar } = useSidebarState();
  const [isInitialRender, setIsInitialRender] = useState(true);
  const pathname = usePathname();
  
  const {
    navigateTo,
    handleChatSessionSelect,
    handleNewChat,
    handleChatSessionDeleted,
    searchMemories,
    handleResultClick,
    handleViewAllResults,
  } = useLayoutNavigation();

  // Enable transitions after first render
  useEffect(() => {
    const enableTransitions = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsInitialRender(false);
        });
      });
    };
    enableTransitions();
  }, []);

  const renderMemoryResult = (result: SearchResult) => {
    const memory = result as MemoryResult;
    return (
      <div
        key={memory.id}
        className="p-3 border-b border-border last:border-b-0 hover:bg-secondary/20 hover:text-foreground cursor-pointer"
        onClick={() => navigateTo(`/memory/${memory.id}`)}
      >
        <div className="flex justify-between mb-1">
          <h4 className="font-medium text-foreground">{memory.title}</h4>
          <span className="text-xs text-muted-foreground">
            {formatMemoryDate(memory.created_at)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {memory.summary ||
            memory.content.substring(0, 120) +
              (memory.content.length > 120 ? "..." : "")}
        </p>
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-1 items-center text-xs text-muted-foreground">
            {getMemoryTypeIcon(memory.memory_type)}
            <span className="ml-1">{memory.memory_type}</span>
          </div>
          <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
            {memory.category}
          </span>
        </div>
      </div>
    );
  };

  const sidebarClasses = `${
    isCollapsed ? "w-20" : "w-64"
  } ${
    isInitialRender ? "" : "transition-all duration-300 ease-in-out"
  } p-4 flex flex-col gap-4 relative border-r overflow-hidden ${
    isCollapsed
      ? "bg-background border-border/50"
      : "bg-sidebar border-sidebar-border"
  }`;

  return (
    <div className="flex h-screen bg-background text-foreground" suppressHydrationWarning>
      {/* Sidebar */}
      <div className={sidebarClasses} suppressHydrationWarning>
        <SidebarHeader
          isCollapsed={isCollapsed}
          onToggle={toggleSidebar}
          onNavigateHome={() => navigateTo("/")}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <NavigationSection
            currentPage={currentPage}
            pathname={pathname}
            isCollapsed={isCollapsed}
            onNavigate={navigateTo}
          />

          <ChatSessionsSidebar
            isVisible={currentPage === "Chat" && !isCollapsed}
            currentSessionId={currentChatSession}
            onSessionSelect={(id) => handleChatSessionSelect(id, onChatSessionChange)}
            onNewChat={(id) => handleNewChat(id, onChatSessionChange)}
            onSessionDeleted={(id) => handleChatSessionDeleted(id, currentChatSession)}
          />
        </div>

        <UserProfileSection
          isCollapsed={isCollapsed}
          onNavigateProfile={() => navigateTo("/profile")}
        />
      </div>

      {/* Main Content */}
      {scrollMode === "container" ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 p-6 pb-4">
            <LayoutHeader
              onNewMemory={() => navigateTo("/new-memory")}
              searchFunction={searchMemories}
              renderResult={renderMemoryResult}
              onResultClick={handleResultClick}
              onViewAllResults={handleViewAllResults}
            />
          </div>
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-6 pb-4">
            <LayoutHeader
              onNewMemory={() => navigateTo("/new-memory")}
              searchFunction={searchMemories}
              renderResult={renderMemoryResult}
              onResultClick={handleResultClick}
              onViewAllResults={handleViewAllResults}
            />
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className={contentPadding ? "p-6 pt-0" : ""}>{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}