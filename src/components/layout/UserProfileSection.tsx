// components/layout/UserProfileSection.tsx - User profile and theme toggle
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useUserProfile } from "@/hooks/useUserProfile";

interface UserProfileSectionProps {
  isCollapsed: boolean;
  onNavigateProfile: () => void;
}

export function UserProfileSection({ isCollapsed, onNavigateProfile }: UserProfileSectionProps) {
  const { theme, toggleTheme } = useTheme();
  const { getInitials } = useUserProfile();

  return (
    <div className="mt-auto flex flex-col space-y-1">
      {/* Theme toggle */}
      <Button
        variant="ghost"
        onClick={toggleTheme}
        className={`justify-start transition-colors duration-200 overflow-hidden ${
          isCollapsed
            ? "text-foreground/70 hover:text-foreground"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
        }`}
      >
        <div
          className={`flex-shrink-0 ${
            isCollapsed
              ? "text-foreground/60"
              : "text-sidebar-foreground/60"
          }`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </div>
        <span
          className={`ml-3 text-sm transition-all duration-300 ease-in-out ${
            isCollapsed
              ? "opacity-0 w-0 translate-x-2"
              : "opacity-100 w-auto translate-x-0"
          }`}
        >
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </span>
      </Button>

      {/* Separator */}
      <div
        className={`my-2 ${
          isCollapsed
            ? "border-t border-border"
            : "border-t border-sidebar-border"
        }`}
      />

      {/* Profile */}
      <Button
        variant="ghost"
        onClick={onNavigateProfile}
        className={`justify-start p-3 transition-colors duration-200 overflow-hidden ${
          isCollapsed
            ? "text-foreground/70 hover:text-foreground"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
        }`}
      >
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground font-medium text-xs">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <span
          className={`ml-3 text-sm font-medium transition-all duration-300 ease-in-out ${
            isCollapsed
              ? "opacity-0 w-0 translate-x-2"
              : "opacity-100 w-auto translate-x-0"
          }`}
        >
          Profile
        </span>
      </Button>
    </div>
  );
}