// lib/services/chat-service.ts - Chat operations extracted
import { supabase } from '@/lib/api/clients';
import { MemoryAssistant } from "@/lib/agents/unified-chat";

export class ChatService {
  private static memoryAssistant = new MemoryAssistant();

  static async processMessage(
    message: string,
    embedding?: any,
    chatHistory: any[] = []
  ) {
    console.log("💬 Memory Assistant request:", message);
    
    const result = await this.memoryAssistant.processMessage(
      message,
      embedding,
      chatHistory
    );

    return result;
  }

  static async saveMessageToHistory(
    sessionId: string,
    userMessage: string,
    aiResult: any
  ) {
    try {
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        content: userMessage,
        role: "user",
      });

      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        content: aiResult.response,
        role: "assistant",
        agent_used: aiResult.agent_used,
        sources: aiResult.sources,
      });

      console.log(`💾 Saved chat messages for session: ${sessionId}`);
    } catch (error) {
      console.error("❌ Error saving chat history:", error);
      // Don't throw - chat history is not critical
    }
  }
}