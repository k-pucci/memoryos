// app/api/chat/unified/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MemoryAssistant } from "@/lib/agents/unified-chat";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const memoryAssistant = new MemoryAssistant();

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      embedding,
      chat_history = [],
      session_id,
    } = await request.json();

    // Validate input
    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log("💬 Memory Assistant request:", message);

    // Process the message through memory assistant
    const result = await memoryAssistant.processMessage(
      message,
      embedding,
      chat_history
    );

    // Save message to chat history (optional)
    if (session_id) {
      await saveMessageToHistory(session_id, message, result);
    }

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
    return NextResponse.json(
      {
        error: "Chat processing failed",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

async function saveMessageToHistory(
  sessionId: string,
  userMessage: string,
  aiResult: any
) {
  try {
    // Save user message
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      content: userMessage,
      role: "user",
    });

    // Save AI response
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
    // Don't throw - this shouldn't break the main chat flow
  }
}
