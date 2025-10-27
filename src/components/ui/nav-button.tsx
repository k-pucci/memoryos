// components/ui/nav-button.tsx - Extract reusable navigation button
"use client";

import React from "react";

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick: () => void;
}

export function NavButton({ icon, label, collapsed, active = false, onClick }: NavButtonProps) {
  const baseClasses = "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ease-in-out relative group cursor-pointer overflow-hidden";
  
  const stateClasses = collapsed
    ? active
      ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
      : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
    : active
    ? "bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/20 hover:bg-sidebar-accent"
    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent";

  const iconClasses = collapsed
    ? active
      ? "text-primary"
      : "text-foreground/60 group-hover:text-foreground/80"
    : active
    ? "text-sidebar-primary"
    : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80";

  const labelClasses = `text-sm font-medium transition-all duration-300 ease-in-out ${
    collapsed
      ? "opacity-0 w-0 translate-x-2"
      : "opacity-100 w-auto translate-x-0"
  }`;

  return (
    <button className={`${baseClasses} ${stateClasses}`} onClick={onClick}>
      <div className={`transition-colors duration-200 flex-shrink-0 ${iconClasses}`}>
        {icon}
      </div>
      <span className={labelClasses}>{label}</span>
    </button>
  );
}