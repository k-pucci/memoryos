// app/api/chat/unified/route.ts
import { ChatService } from '@/lib/services/chat-service';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { ApiResponse, withAuth } from '@/lib/api/response-utils';
import { validateChatInput } from '@/lib/api/validation-utils';

export async function POST(request: Request) {
  return withAuth(request, async (request, user) => {
    const startTime = Date.now();
    
    try {
      const body = await request.json();
      const input = validateChatInput(body);
      
      // Add authenticated user ID to the input
      const chatInput = {
        ...input,
        user_id: user.id
      };
      
      const result = await ChatService.processMessage(
        input.message,
        user.id,        
        input.embedding,
        input.chat_history
      );

      if (chatInput.session_id) {
        await ChatService.saveMessageToHistory(
          chatInput.session_id, 
          chatInput.message, 
          result,
          user.id // Ensure chat history is tied to user
        );
      }

      // Track success with authenticated user
      await AnalyticsService.trackAIMessage({
        user_id: user.id,
        session_id: chatInput.session_id,
        message: chatInput.message,
        result,
        startTime,
        embedding: chatInput.embedding,
        chat_history: chatInput.chat_history
      });

      return ApiResponse.success({
        response: result.response,
        agent_used: result.agent_used,
        sources: result.sources,
        metadata: {
          memory_count: result.memory_count,
          search_performed: result.search_performed,
        },
      });
    } catch (error: any) {
      console.error("❌ Memory Assistant error:", error);
      
      await AnalyticsService.trackAIMessageFailed(error, startTime, user.id);
      
      return ApiResponse.serverError({
        error: "Chat processing failed",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      });
    } finally {
      await AnalyticsService.shutdown();
    }
  });
}