import React, { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  size?: "default" | "large";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "default",
}: EmptyStateProps) {
  const containerHeight = size === "large" ? "h-96" : "h-64";

  return (
    <div
      className={`flex flex-col items-center justify-center ${containerHeight} text-center`}
    >
      <div className="text-muted-foreground/50 mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-primary rounded-lg text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
