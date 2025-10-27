// components/layout/SidebarHeader.tsx - Just the header section
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigateHome: () => void;
}

export function SidebarHeader({ isCollapsed, onToggle, onNavigateHome }: SidebarHeaderProps) {
  return (
    <div className={`flex items-center mb-8 ${isCollapsed ? "justify-center" : "justify-between"}`}>
      {!isCollapsed && (
        <div
          className="flex items-center cursor-pointer overflow-hidden"
          onClick={onNavigateHome}
        >
          <span className="brand-terracotta text-2xl font-bold mr-1 transition-opacity duration-300 ease-in-out">
            Cognote
          </span>
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={`transition-colors duration-200 ${
          isCollapsed
            ? "text-foreground/60 hover:text-foreground"
            : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
        }`}
      >
        <Menu size={18} />
      </Button>
    </div>
  );
}