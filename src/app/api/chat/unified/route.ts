// /app/api/chat/unified/route.ts
import { NextRequest, NextResponse } from "next/server";
import { UnifiedChatManager } from "@/lib/agents/unified-chat";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const chatManager = new UnifiedChatManager();

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      embedding,
      chat_history = [],
      session_id,
    } = await request.json();

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log("💬 Unified chat request:", message);

    // Get user ID (you'll need to implement auth)
    const userId = "temp-user-id"; // Replace with actual auth

    // Process the message through unified chat manager
    const result = await chatManager.processMessage(
      message,
      embedding,
      chat_history,
      userId
    );

    // Save message to chat history (optional)
    if (session_id) {
      await saveMessageToHistory(session_id, message, result, userId);
    }

    return NextResponse.json({
      response: result.response,
      agent_used: result.agent_used,
      agent_id: result.agent_id,
      sources: result.sources,
      mentioned_agents: result.mentioned_agents,
      metadata: {
        search_strategy: result.search_strategy,
        memory_count: result.memory_count,
      },
    });
  } catch (error) {
    console.error("❌ Unified chat error:", error);
    return NextResponse.json(
      { error: "Chat processing failed" },
      { status: 500 }
    );
  }
}

async function saveMessageToHistory(
  sessionId: string,
  userMessage: string,
  aiResult: any,
  userId: string
) {
  try {
    // Save user message
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      content: userMessage,
      role: "user",
      mentioned_agents: aiResult.mentioned_agents,
    });

    // Save AI response
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      content: aiResult.response,
      role: "assistant",
      agent_used: aiResult.agent_used,
      sources: aiResult.sources,
    });

    // Update agent usage analytics
    if (aiResult.agent_id) {
      await supabase.rpc("increment_agent_usage", {
        agent_id: aiResult.agent_id,
      });
    }
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
}
