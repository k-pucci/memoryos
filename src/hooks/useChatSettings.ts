// hooks/useChatSettings.ts - Chat retrieval settings with localStorage persistence
"use client";

import { useState, useEffect, useCallback } from "react";

export interface ChatSettings {
  threshold: number;
  contentPreviewLength: number; // 0 means full content
  maxResults: number;
  customDirective: string;
}

const STORAGE_KEY = "chat-retrieval-settings";

const DEFAULT_SETTINGS: ChatSettings = {
  threshold: 0.4,
  contentPreviewLength: 300,
  maxResults: 15,
  customDirective: "",
};

export function useChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // Ignore parse errors, use defaults
    }
  }, []);

  const updateSettings = useCallback((partial: Partial<ChatSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  return {
    settings: hasMounted ? settings : DEFAULT_SETTINGS,
    updateSettings,
    hasMounted,
  };
}
