// lib/services/chat-service.ts - Updated imports
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MemoryAssistant } from "@/lib/agents/unified-chat";

export class ChatService {
  private static memoryAssistant = new MemoryAssistant();

  static async processMessage(
    message: string,
    userId: string,
    embedding?: any,
    chatHistory: any[] = []
  ) {
    console.log("💬 Memory Assistant request:", message);
    
    const result = await this.memoryAssistant.processMessage(
      message,
      userId,
      embedding,
      chatHistory
    );

    return result;
  }

  static async saveMessageToHistory(
    sessionId: string,
    userMessage: string,
    aiResult: any,
    userId: string
  ) {
    try {
      // First verify the session belongs to the user or create it
      const { data: session, error: sessionError } = await supabaseAdmin
        .from("chat_sessions")
        .select("user_id")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single();

      if (sessionError || !session) {
        // Create session if it doesn't exist
        console.log(`Creating new chat session: ${sessionId} for user: ${userId}`);
        await supabaseAdmin.from("chat_sessions").insert({
          id: sessionId,
          user_id: userId,
          title: userMessage.length > 50 ? userMessage.substring(0, 50) + "..." : userMessage,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Save user message
      await supabaseAdmin.from("chat_messages").insert({
        session_id: sessionId,
        content: userMessage,
        role: "user",
        created_at: new Date().toISOString(),
      });

      // Save AI response
      await supabaseAdmin.from("chat_messages").insert({
        session_id: sessionId,
        content: aiResult.response,
        role: "assistant",
        agent_used: aiResult.agent_used || "default",
        sources: aiResult.sources || null,
        created_at: new Date().toISOString(),
      });

      // Update session timestamp
      await supabaseAdmin
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("user_id", userId);

      console.log(`💾 Saved chat messages for session: ${sessionId}`);
    } catch (error) {
      console.error("❌ Error saving chat history:", error);
      // Don't throw - chat history is not critical for the chat experience
    }
  }

  // Get user's chat sessions
  static async getUserChatSessions(userId: string, limit = 10) {
    try {
      const { data, error } = await supabaseAdmin
        .from("chat_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      return [];
    }
  }

  // Get chat session messages
  static async getChatSessionMessages(sessionId: string, userId: string) {
    try {
      // First verify the session belongs to the user
      const { data: session, error: sessionError } = await supabaseAdmin
        .from("chat_sessions")
        .select("user_id")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single();

      if (sessionError || !session) {
        throw new Error("Session not found or access denied");
      }

      // Get messages for the session
      const { data, error } = await supabaseAdmin
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      throw error;
    }
  }

  // Create a new chat session
  static async createChatSession(userId: string, title?: string) {
    try {
      const sessionId = crypto.randomUUID();
      
      const { data, error } = await supabaseAdmin
        .from("chat_sessions")
        .insert({
          id: sessionId,
          user_id: userId,
          title: title || "New Chat",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log(`📝 Created new chat session: ${sessionId}`);
      return data;
    } catch (error) {
      console.error("Error creating chat session:", error);
      throw error;
    }
  }

  // Update chat session title
  static async updateChatSessionTitle(sessionId: string, userId: string, title: string) {
    try {
      const { error } = await supabaseAdmin
        .from("chat_sessions")
        .update({ 
          title,
          updated_at: new Date().toISOString() 
        })
        .eq("id", sessionId)
        .eq("user_id", userId);

      if (error) throw error;
      
      console.log(`📝 Updated chat session title: ${sessionId}`);
    } catch (error) {
      console.error("Error updating chat session title:", error);
      throw error;
    }
  }

  // Delete chat session and all its messages
  static async deleteChatSession(sessionId: string, userId: string) {
    try {
      // Delete messages first (due to foreign key constraint)
      await supabaseAdmin
        .from("chat_messages")
        .delete()
        .eq("session_id", sessionId);

      // Delete session (with user verification)
      const { error } = await supabaseAdmin
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", userId);

      if (error) throw error;
      
      console.log(`🗑️ Deleted chat session: ${sessionId}`);
      return { success: true };
    } catch (error) {
      console.error("Error deleting chat session:", error);
      throw error;
    }
  }

  // Get chat session by ID (with user verification)
  static async getChatSession(sessionId: string, userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from("chat_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching chat session:", error);
      throw error;
    }
  }

  // Clear all messages from a chat session (keep the session)
  static async clearChatSession(sessionId: string, userId: string) {
    try {
      // First verify the session belongs to the user
      const session = await this.getChatSession(sessionId, userId);
      if (!session) {
        throw new Error("Session not found or access denied");
      }

      // Delete all messages in the session
      const { error } = await supabaseAdmin
        .from("chat_messages")
        .delete()
        .eq("session_id", sessionId);

      if (error) throw error;

      // Update session timestamp
      await supabaseAdmin
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("user_id", userId);
      
      console.log(`🧹 Cleared chat session: ${sessionId}`);
      return { success: true };
    } catch (error) {
      console.error("Error clearing chat session:", error);
      throw error;
    }
  }
}