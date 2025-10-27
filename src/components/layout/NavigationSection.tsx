// components/layout/NavigationSection.tsx - Simplified with extracted NavButton
"use client";

import React from "react";
import { Home, BookOpen, MessageSquare } from "lucide-react";
import { NavButton } from "@/components/ui/nav-button";
import { getNavItemActiveState } from "@/lib/layout-utils";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

interface NavigationSectionProps {
  currentPage: string;
  pathname: string;
  isCollapsed: boolean;
  onNavigate: (path: string) => void;
}

const NAV_ITEMS: NavItem[] = [
  { icon: <Home size={18} />, label: "Home", path: "/" },
  { icon: <BookOpen size={18} />, label: "Library", path: "/library" },
  { icon: <MessageSquare size={18} />, label: "Chat", path: "/chat" },
];

export function NavigationSection({ currentPage, pathname, isCollapsed, onNavigate }: NavigationSectionProps) {
  return (
    <div className="flex flex-col space-y-1">
      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.path}
          icon={item.icon}
          label={item.label}
          collapsed={isCollapsed}
          active={getNavItemActiveState(currentPage, pathname, item.path, item.label)}
          onClick={() => onNavigate(item.path)}
        />
      ))}
    </div>
  );
}