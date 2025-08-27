// components/layout.tsx - Clean persistent sidebar state without hydration issues
"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SearchBar, SearchResult } from "@/components/ui/search-bar";
import {
  Home,
  BookOpen,
  Bell,
  Settings,
  Plus,
  Menu,
  Moon,
  Sun,
  MessageSquare,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import {
  MemoryResult,
  getMemoryTypeIcon,
  formatMemoryDate,
} from "@/lib/memory-utils";
import { performMemorySearch } from "@/lib/search-utils";

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  scrollMode?: "page" | "container";
  contentPadding?: boolean;
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick: () => void;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

export default function Layout({
  children,
  currentPage = "Home",
  scrollMode = "page",
  contentPadding = true,
}: LayoutProps) {
  // Initialize with saved state immediately to prevent flash
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  
  // Track if this is the initial render to prevent transition animation
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // After first render, enable transitions
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has fully painted
    const enableTransitions = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsInitialRender(false);
        });
      });
    };
    
    enableTransitions();
  }, []);

  // Save to localStorage whenever sidebar state changes
  const handleSidebarToggle = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
    }
  };

  // Navigation items with their paths
  const navItems: NavItem[] = [
    { icon: <Home size={18} />, label: "Home", path: "/" },
    { icon: <BookOpen size={18} />, label: "Library", path: "/library" },
    { icon: <MessageSquare size={18} />, label: "Chat", path: "/chat" },
  ];

  const bottomNavItems: NavItem[] = [];

  // Handle navigation
  const navigateTo = (path: string) => {
    router.push(path);
  };

  // Search function for memories
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

  // Custom result renderer for memories
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

  // Handle search result click
  const handleResultClick = (result: SearchResult) => {
    navigateTo(`/memory/${result.id}`);
  };

  // Handle view all results
  const handleViewAllResults = (query: string) => {
    router.push(`/library?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex h-screen bg-background text-foreground" suppressHydrationWarning>
      {/* Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } ${
          isInitialRender ? "" : "transition-all duration-300 ease-in-out"
        } p-4 flex flex-col gap-4 relative border-r overflow-hidden ${
          sidebarCollapsed
            ? "bg-background border-border/50"
            : "bg-sidebar border-sidebar-border"
        }`}
        suppressHydrationWarning
      >
        {/* Header */}
        <div
          className={`flex items-center mb-8 ${
            sidebarCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!sidebarCollapsed && (
            <div
              className="flex items-center cursor-pointer overflow-hidden"
              onClick={() => navigateTo("/")}
            >
              <span className="brand-terracotta text-2xl font-bold mr-1 transition-opacity duration-300 ease-in-out">
                Cognote
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSidebarToggle}
            className={`transition-colors duration-200 ${
              sidebarCollapsed
                ? "text-foreground/60 hover:text-foreground"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            }`}
          >
            <Menu size={18} />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col space-y-1">
          {navItems.map((item, index) => (
            <NavButton
              key={index}
              icon={item.icon}
              label={item.label}
              collapsed={sidebarCollapsed}
              active={
                (currentPage === "Chat" && item.path === "/chat") ||
                currentPage === item.label ||
                (currentPage === "Home" &&
                  item.path === "/" &&
                  pathname === "/")
              }
              onClick={() => navigateTo(item.path)}
            />
          ))}
        </div>

        {/* Bottom buttons */}
        <div className="mt-auto flex flex-col space-y-1">
          {/* Theme toggle button */}
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className={`justify-start transition-colors duration-200 overflow-hidden ${
              sidebarCollapsed
                ? "text-foreground/70 hover:text-foreground"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
            }`}
          >
            <div
              className={`flex-shrink-0 ${
                sidebarCollapsed
                  ? "text-foreground/60"
                  : "text-sidebar-foreground/60"
              }`}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <span
              className={`ml-3 text-sm transition-all duration-300 ease-in-out ${
                sidebarCollapsed
                  ? "opacity-0 w-0 translate-x-2"
                  : "opacity-100 w-auto translate-x-0"
              }`}
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </Button>

          {bottomNavItems.map((item, index) => (
            <NavButton
              key={index}
              icon={item.icon}
              label={item.label}
              collapsed={sidebarCollapsed}
              active={currentPage === item.label}
              onClick={() => navigateTo(item.path)}
            />
          ))}

          {/* Separator Line */}
          <div
            className={`my-2 ${
              sidebarCollapsed
                ? "border-t border-border"
                : "border-t border-sidebar-border"
            }`}
          />

          {/* Profile Section */}
          <Button
            variant="ghost"
            onClick={() => navigateTo("/profile")}
            className={`justify-start p-3 transition-colors duration-200 overflow-hidden ${
              sidebarCollapsed
                ? "text-foreground/70 hover:text-foreground"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
            }`}
          >
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground font-medium text-xs">
                MS
              </AvatarFallback>
            </Avatar>
            <span
              className={`ml-3 text-sm font-medium transition-all duration-300 ease-in-out ${
                sidebarCollapsed
                  ? "opacity-0 w-0 translate-x-2"
                  : "opacity-100 w-auto translate-x-0"
              }`}
            >
              Profile
            </span>
          </Button>
        </div>
      </div>

      {/* Main Content - Conditional based on scroll mode */}
      {scrollMode === "container" ? (
        // Container scroll mode - for chat page
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Fixed Header */}
          <div className="flex-shrink-0 p-6 pb-4">
            <div className="flex items-center gap-3">
              {/* Search Bar - Full Width */}
              <SearchBar
                placeholder="Search your memories..."
                searchFunction={searchMemories}
                renderResult={renderMemoryResult}
                onResultClick={handleResultClick}
                onViewAllResults={handleViewAllResults}
                className="flex-1"
                size="lg"
                variant="default"
              />

              {/* New Memory Button */}
              <Button
                onClick={() => navigateTo("/new-memory")}
                className="h-10 px-4"
              >
                <Plus size={18} />
                <span className="ml-2">New Memory</span>
              </Button>
            </div>
          </div>

          {/* Scrollable Content Area - children manage their own scroll */}
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      ) : (
        // Page scroll mode - for homepage and other pages with sticky header
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sticky Header */}
          <div className="flex-shrink-0 sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-6 pb-4">
            <div className="flex items-center gap-3">
              {/* Search Bar - Full Width */}
              <SearchBar
                placeholder="Search your memories..."
                searchFunction={searchMemories}
                renderResult={renderMemoryResult}
                onResultClick={handleResultClick}
                onViewAllResults={handleViewAllResults}
                className="flex-1"
                size="lg"
                variant="default"
              />

              {/* New Memory Button */}
              <Button
                onClick={() => navigateTo("/new-memory")}
                className="h-10 px-4"
              >
                <Plus size={18} />
                <span className="ml-2">New Memory</span>
              </Button>
            </div>
          </div>

          {/* Scrollable Content - IMPROVED: Conditional padding */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className={contentPadding ? "p-6 pt-0" : ""}>{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Navigation Button Component - Updated for collapsed state
function NavButton({
  icon,
  label,
  collapsed,
  active = false,
  onClick,
}: NavButtonProps) {
  return (
    <button
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ease-in-out relative group cursor-pointer overflow-hidden ${
        collapsed
          ? // Collapsed state - use main page colors
            active
            ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
            : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
          : // Expanded state - use sidebar colors
          active
          ? "bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/20 hover:bg-sidebar-accent"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
      }`}
      onClick={onClick}
    >
      <div
        className={`transition-colors duration-200 flex-shrink-0 ${
          collapsed
            ? // Collapsed state icons
              active
              ? "text-primary"
              : "text-foreground/60 group-hover:text-foreground/80"
            : // Expanded state icons
            active
            ? "text-sidebar-primary"
            : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80"
        }`}
      >
        {icon}
      </div>

      <span
        className={`text-sm font-medium transition-all duration-300 ease-in-out ${
          collapsed
            ? "opacity-0 w-0 translate-x-2"
            : "opacity-100 w-auto translate-x-0"
        }`}
      >
        {label}
      </span>
    </button>
  );
}