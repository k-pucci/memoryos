// hooks/useChatSessions.ts - Updated to use API calls
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

export function useChatSessions(isActive: boolean) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !isActive) {
      setSessions([]);
      return;
    }

    const fetchSessions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/chat/sessions?limit=8`);
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions || []);
        } else {
          console.error("Failed to fetch sessions:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching chat sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user, isActive]);

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
  };
}