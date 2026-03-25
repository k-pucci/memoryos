// hooks/useChatSessions.ts - Updated to use API calls
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

export function useChatSessions(isActive: boolean, currentSessionId?: string | null) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);

  // Track sessions we've already tried to find (to prevent infinite refetch)
  const checkedSessionsRef = useRef<Set<string>>(new Set());
  // Prevent concurrent fetches
  const isFetchingRef = useRef(false);
  // Track if we've done initial load (for showing loading state only on first load)
  const hasLoadedRef = useRef(false);

  const fetchSessions = useCallback(async (showLoadingState = false) => {
    if (!user || isFetchingRef.current) return;

    isFetchingRef.current = true;
    // Only show loading state on initial load or when explicitly requested
    if (showLoadingState && !hasLoadedRef.current) {
      setLoading(true);
    }
    try {
      const response = await fetch(`/api/chat/sessions?limit=8`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        hasLoadedRef.current = true;
      } else {
        console.error("Failed to fetch sessions:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user]);

  // Initial fetch and refetch when active/user changes
  useEffect(() => {
    if (!user || !isActive) {
      setSessions([]);
      checkedSessionsRef.current.clear();
      hasLoadedRef.current = false;
      return;
    }

    // Show loading only on initial fetch
    fetchSessions(true);
  }, [user, isActive, fetchSessions]);

  // Refetch when current session changes (to catch newly created sessions)
  // Only refetch once per session ID to prevent infinite loops
  useEffect(() => {
    if (!user || !isActive || !currentSessionId) return;
    if (checkedSessionsRef.current.has(currentSessionId)) return;

    // Check if current session is in the list
    const sessionExists = sessions.some(s => s.id === currentSessionId);
    if (!sessionExists && sessions.length > 0) {
      // Mark this session as checked before fetching
      checkedSessionsRef.current.add(currentSessionId);
      // Silent background refresh - don't show loading
      fetchSessions(false);
    }
  }, [currentSessionId, user, isActive, sessions, fetchSessions]);

  const createSession = async (title?: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title || 'New Chat' }),
      });

      if (response.ok) {
        const data = await response.json();
        const newSession = data.session;
        setSessions(prev => [newSession, ...prev]);
        return newSession.id;
      } else {
        console.error("Failed to create session:", response.statusText);
        return null;
      }
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } else {
        console.error("Failed to delete session:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const updateSessionTitle = async (sessionId: string, title: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? { ...s, title, updated_at: new Date().toISOString() } : s
        ));
      } else {
        console.error("Failed to update session title:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating session title:", error);
    }
  };

  return {
    sessions,
    loading,
    createSession,
    deleteSession,
    updateSessionTitle,
    refetch: () => fetchSessions(false),
  };
}