// src/components/layout/PageLayout.tsx
import React from "react";
import Layout from "@/components/layout"; // This refers to components/layout.tsx
import { Container } from "./primitives";

interface PageLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  scrollMode?: "page" | "container";
  title: string;
  description?: string;
  actions?: React.ReactNode;
  // Layout control props
  variant?: "default" | "full-width" | "contained";
  headerBorder?: boolean;
}

export function PageLayout({
  children,
  currentPage,
  scrollMode = "page",
  title,
  description,
  actions,
  variant = "contained",
  headerBorder = false,
}: PageLayoutProps) {
  const headerClasses = [
    "px-6 pt-4 pb-6",
    headerBorder ? "border-b border-border/50" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Layout
      currentPage={currentPage}
      scrollMode={scrollMode}
      contentPadding={false}
    >
      {/* Consistent Header */}
      <header className={headerClasses}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold brand-terracotta">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          {actions && <div className="flex gap-3">{actions}</div>}
        </div>
      </header>

      {/* Content with variant-based layout */}
      {variant === "full-width" ? (
        children
      ) : variant === "contained" ? (
        <Container>{children}</Container>
      ) : (
        <div className="px-6 pb-6">{children}</div>
      )}
    </Layout>
  );
}

// Specialized page layouts
export function DashboardLayout({
  children,
  container = true,
  ...props
}: Omit<PageLayoutProps, "variant"> & { container?: boolean }) {
  return (
    <PageLayout {...props} variant="full-width">
      {container ? (
        <div className="max-w-7xl mx-auto">{children}</div>
      ) : (
        children
      )}
    </PageLayout>
  );
}

export function FullWidthLayout({
  children,
  ...props
}: Omit<PageLayoutProps, "variant">) {
  return (
    <PageLayout {...props} variant="full-width">
      {children}
    </PageLayout>
  );
}

// Chat-specific layout for container scrolling
export function ChatLayout({
  children,
  ...props
}: Omit<PageLayoutProps, "variant" | "scrollMode">) {
  return (
    <Layout
      currentPage={props.currentPage}
      scrollMode="container" // Use container scroll mode
      contentPadding={false}
    >
      {/* Chat Header - Fixed */}
      <div className="flex-shrink-0 px-6 pt-4 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold brand-terracotta">
              {props.title}
            </h1>
            {props.description && (
              <p className="text-muted-foreground mt-2">{props.description}</p>
            )}
          </div>
          {props.actions && <div className="flex gap-3">{props.actions}</div>}
        </div>
      </div>

      {/* Chat Content - Scrollable */}
      <div className="flex-1 overflow-hidden px-6 pb-6">{children}</div>
    </Layout>
  );
}
