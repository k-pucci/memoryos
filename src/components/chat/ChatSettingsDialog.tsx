"use client";

import React, { useState, useEffect, useRef } from "react";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { ChatSettings } from "@/hooks/useChatSettings";

interface ChatSettingsDialogProps {
  settings: ChatSettings;
  onUpdateSettings: (partial: Partial<ChatSettings>) => void;
}

const thresholdOptions = [
  { value: "0.1", label: "0.1 — Very loose" },
  { value: "0.2", label: "0.2 — Loose" },
  { value: "0.3", label: "0.3 — Relaxed" },
  { value: "0.4", label: "0.4 — Moderate" },
  { value: "0.5", label: "0.5 — Balanced (default)" },
  { value: "0.6", label: "0.6 — Focused" },
  { value: "0.7", label: "0.7 — Strict" },
  { value: "0.8", label: "0.8 — Very strict" },
  { value: "0.9", label: "0.9 — Exact match" },
];

const previewLengthOptions = [
  { value: "300", label: "300 chars (default)" },
  { value: "500", label: "500 chars" },
  { value: "800", label: "800 chars" },
  { value: "0", label: "Full content" },
];

const maxResultsOptions = [
  { value: "5", label: "5 memories" },
  { value: "10", label: "10 memories" },
  { value: "15", label: "15 memories (default)" },
  { value: "25", label: "25 memories" },
];

const modelOptions = [
  { value: "current", label: "gpt-oss-20b (Groq)" },
];

export function ChatSettingsDialog({
  settings,
  onUpdateSettings,
}: ChatSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  // Close on click outside the panel
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    // Delay to avoid the trigger click from immediately closing
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        className="h-9 px-3 gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Settings size={16} />
        <span className="hidden sm:inline">Settings</span>
      </Button>

      {/* Backdrop + Slide-out Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Semi-transparent backdrop */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Panel sliding from right */}
          <div
            ref={panelRef}
            className="absolute top-0 right-0 h-full w-full max-w-sm bg-card border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-primary" />
                <h2 className="text-lg font-bold text-foreground">Retrieval Settings</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              <p className="text-sm text-muted-foreground">
                Tune how memories are retrieved for chat responses.
              </p>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Similarity Threshold
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Lower values return more results, higher values are stricter.
                </p>
                <Select
                  name="threshold"
                  value={String(settings.threshold)}
                  onChange={(val) => onUpdateSettings({ threshold: parseFloat(val) })}
                  options={thresholdOptions}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Content Preview Length
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  How much of each memory is sent to the AI for context.
                </p>
                <Select
                  name="contentPreviewLength"
                  value={String(settings.contentPreviewLength)}
                  onChange={(val) => onUpdateSettings({ contentPreviewLength: parseInt(val) })}
                  options={previewLengthOptions}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Max Memories Retrieved
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Maximum number of memories to search through.
                </p>
                <Select
                  name="maxResults"
                  value={String(settings.maxResults)}
                  onChange={(val) => onUpdateSettings({ maxResults: parseInt(val) })}
                  options={maxResultsOptions}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Model
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Model selection coming soon.
                </p>
                <Select
                  name="model"
                  value="current"
                  onChange={() => {}}
                  options={modelOptions}
                  disabled
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Custom Directive
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Add custom instructions for the AI. This is appended to every message.
                </p>
                <textarea
                  value={settings.customDirective || ""}
                  onChange={(e) => onUpdateSettings({ customDirective: e.target.value })}
                  placeholder="e.g. Always respond in bullet points. Focus on action items..."
                  className="w-full min-h-[100px] max-h-[200px] px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
