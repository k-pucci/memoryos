// hooks/useSidebarState.ts - Pure sidebar state management
"use client";

import { useState, useEffect } from "react";

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  return {
    isCollapsed: hasMounted ? isCollapsed : false,
    toggle,
    hasMounted,
  };
}