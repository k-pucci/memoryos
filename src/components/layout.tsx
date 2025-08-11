// components/layout.tsx - Updated to use SearchBar component
"use client";

import React, { useState } from "react";
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
}: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // Navigation items with their paths
  const navItems: NavItem[] = [
    { icon: <Home size={18} />, label: "Home", path: "/" },
    { icon: <BookOpen size={18} />, label: "Library", path: "/library" },
    { icon: <MessageSquare size={18} />, label: "Chat", path: "/chat" },
    {
      icon: <Settings size={18} />,
      label: "Agents",
      path: "/agents/view",
    },
  ];

  const bottomNavItems: NavItem[] = [
    // Temporarily commented out notifications
    // {
    //   icon: <Bell size={18} />,
    //   label: "Notifications",
    //   path: "/notifications",
    // },
  ];

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
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } transition-all duration-300 p-4 flex flex-col gap-4 relative border-r border-sidebar-border bg-sidebar`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {!sidebarCollapsed && (
            <div
              className="flex items-center cursor-pointer"
              onClick={() => navigateTo("/")}
            >
              <span className="brand-terracotta text-2xl font-bold mr-1">
                Cognote
              </span>
            </div>
          )}
          {sidebarCollapsed && (
            <div
              className="mx-auto brand-terracotta text-2xl font-bold cursor-pointer"
              onClick={() => navigateTo("/")}
            >
              C
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
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
            className="justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <div className="text-sidebar-foreground/60">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            {!sidebarCollapsed && (
              <span className="ml-3 text-sm">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            )}
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
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          {/* Search Bar */}
          <SearchBar
            placeholder="Search your memories..."
            searchFunction={searchMemories}
            renderResult={renderMemoryResult}
            onResultClick={handleResultClick}
            onViewAllResults={handleViewAllResults}
            className="w-2/3"
            size="lg"
            variant="default"
          />

          {/* User Avatar */}
          <div className="flex items-center gap-3">
            <Button onClick={() => navigateTo("/new-memory")}>
              <Plus size={18} />
              <span className="hidden sm:inline ml-2">New Memory</span>
              <span className="sm:hidden ml-2">New</span>
            </Button>
            <Avatar
              className="border-2 border-primary/30 h-10 w-10 cursor-pointer"
              onClick={() => navigateTo("/profile")}
            >
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                MS
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

// Navigation Button Component - keeping custom as it's layout-specific
function NavButton({
  icon,
  label,
  collapsed,
  active = false,
  onClick,
}: NavButtonProps) {
  return (
    <button
      className={`flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-sidebar-accent transition-colors relative group cursor-pointer ${
        active
          ? "bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/20"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
      }`}
      onClick={onClick}
    >
      <div
        className={
          active
            ? "text-sidebar-primary"
            : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80"
        }
      >
        {icon}
      </div>

      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
