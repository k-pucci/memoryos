// components/layout/primitives.tsx
import React from "react";
import { cn } from "@/lib/utils";

// Spacing system
export const spacing = {
  "0": "",
  "1": "4px",
  "2": "8px",
  "3": "12px",
  "4": "16px",
  "5": "20px",
  "6": "24px",
  "8": "32px",
  "10": "40px",
  "12": "48px",
} as const;

type SpacingValue = keyof typeof spacing;

// Stack - vertical spacing component
interface StackProps {
  children: React.ReactNode;
  space?: SpacingValue;
  className?: string;
}

export function Stack({ children, space = "4", className }: StackProps) {
  const spaceClass = space === "0" ? "" : `space-y-${space}`;
  return <div className={cn(spaceClass, className)}>{children}</div>;
}

// Grid - responsive grid component
interface GridProps {
  children: React.ReactNode;
  cols?: string | number;
  gap?: SpacingValue;
  className?: string;
  responsive?: {
    sm?: string | number;
    md?: string | number;
    lg?: string | number;
    xl?: string | number;
  };
}

export function Grid({
  children,
  cols = "1",
  gap = "4",
  className,
  responsive,
}: GridProps) {
  const baseClass = `grid grid-cols-${cols}`;
  const gapClass = gap === "0" ? "" : `gap-${gap}`;

  const responsiveClasses = responsive
    ? Object.entries(responsive)
        .map(([breakpoint, colCount]) => `${breakpoint}:grid-cols-${colCount}`)
        .join(" ")
    : "";

  return (
    <div className={cn(baseClass, gapClass, responsiveClasses, className)}>
      {children}
    </div>
  );
}

// Container - consistent padding container
interface ContainerProps {
  children: React.ReactNode;
  padding?: SpacingValue;
  className?: string;
}

export function Container({
  children,
  padding = "6",
  className,
}: ContainerProps) {
  const paddingClass = padding === "0" ? "" : `p-${padding}`;
  return <div className={cn(paddingClass, className)}>{children}</div>;
}

// Section - semantic content sections
interface SectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function Section({
  children,
  title,
  description,
  actions,
  className,
}: SectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && <div className="flex gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// Sidebar Layout - for two-column layouts
interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarPosition?: "left" | "right";
  mainCols?: number;
  sidebarCols?: number;
  gap?: SpacingValue;
  className?: string;
}

export function SidebarLayout({
  children,
  sidebar,
  sidebarPosition = "right",
  mainCols = 2,
  sidebarCols = 1,
  gap = "8",
  className,
}: SidebarLayoutProps) {
  const totalCols = mainCols + sidebarCols;
  const mainSpan = `lg:col-span-${mainCols}`;
  const sidebarSpan = `lg:col-span-${sidebarCols}`;

  return (
    <div className={cn(`grid lg:grid-cols-${totalCols} gap-${gap}`, className)}>
      {sidebarPosition === "left" && (
        <aside className={sidebarSpan}>{sidebar}</aside>
      )}
      <main className={mainSpan}>{children}</main>
      {sidebarPosition === "right" && (
        <aside className={sidebarSpan}>{sidebar}</aside>
      )}
    </div>
  );
}
