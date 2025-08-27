// app/api/chat/unified/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MemoryAssistant } from "@/lib/agents/unified-chat";
import { createClient } from "@supabase/supabase-js";
import { PostHog } from 'posthog-node'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const memoryAssistant = new MemoryAssistant();

const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com' }
)

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const {
      message,
      embedding,
      chat_history = [],
      session_id,
      user_id,
    } = await request.json();

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log("💬 Memory Assistant request:", message);

    const result = await memoryAssistant.processMessage(
      message,
      embedding,
      chat_history
    );

    if (session_id) {
      await saveMessageToHistory(session_id, message, result);
    }

    // 🎯 TRACK AI MESSAGE EVENT
    posthog.capture({
      distinctId: user_id || session_id || 'anonymous',
      event: 'ai_message',
      properties: {
        agent_used: result.agent_used,
        message_length: message.length,
        response_length: result.response.length,
        has_sources: !!(result.sources && result.sources.length > 0),
        sources_count: result.sources ? result.sources.length : 0,
        memory_count: result.memory_count || 0,
        search_performed: result.search_performed || false,
        session_id: session_id,
        response_time_ms: Date.now() - startTime,
        has_embedding: !!embedding,
        chat_history_length: chat_history.length,
        timestamp: new Date().toISOString(),
      }
    })

    return NextResponse.json({
      response: result.response,
      agent_used: result.agent_used,
      sources: result.sources,
      metadata: {
        memory_count: result.memory_count,
        search_performed: result.search_performed,
      },
    });
  } catch (error) {
    console.error("❌ Memory Assistant error:", error);
    
    // Track AI error
    posthog.capture({
      distinctId: 'anonymous',
      event: 'ai_message_failed',
      properties: {
        error_message: String(error),
        response_time_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }
    })

    return NextResponse.json(
      {
        error: "Chat processing failed",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  } finally {
    await posthog.shutdown()
  }
}

async function saveMessageToHistory(
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
  }
}
