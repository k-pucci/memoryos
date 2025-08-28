// app/api/chat/unified/route.ts
import { ChatService } from '@/lib/services/chat-service';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { ApiResponse } from '@/lib/api/response-utils';
import { validateChatInput } from '@/lib/api/validation-utils';

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const input = validateChatInput(body);
    
    const result = await ChatService.processMessage(
      input.message,
      input.embedding,
      input.chat_history
    );

    if (input.session_id) {
      await ChatService.saveMessageToHistory(input.session_id, input.message, result);
    }

    // Track success
    await AnalyticsService.trackAIMessage({
      user_id: input.user_id,
      session_id: input.session_id,
      message: input.message,
      result,
      startTime,
      embedding: input.embedding,
      chat_history: input.chat_history
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
    
    await AnalyticsService.trackAIMessageFailed(error, startTime);
    
    return ApiResponse.serverError({
      error: "Chat processing failed",
      details: process.env.NODE_ENV === "development" ? String(error) : undefined,
    });
  } finally {
    await AnalyticsService.shutdown();
  }
}
