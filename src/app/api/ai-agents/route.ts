import { NextRequest, NextResponse } from "next/server";
import { askAgent } from "@/lib/groq";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { message, agentType = "helper", embedding } = await request.json();

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    let relevantMemories = [];

    // Try semantic search first if embedding is provided
    if (embedding && Array.isArray(embedding) && embedding.length === 384) {
      try {
        const { data, error } = await supabase.rpc("match_memories", {
          query_embedding: embedding,
          similarity_threshold: 0.6,
          match_count: 5,
        });

        if (!error && data) {
          relevantMemories = data;
        }
      } catch (error) {
        console.error("Semantic search error:", error);
      }
    }

    // Fallback to text search if semantic search failed or no embedding
    if (relevantMemories.length === 0) {
      const { data } = await supabase
        .from("memories")
        .select("id, title, content, category, tags, created_at")
        .or(`title.ilike.%${message}%,content.ilike.%${message}%`)
        .order("created_at", { ascending: false })
        .limit(5);

      relevantMemories = data || [];
    }

    // Get AI response
    const response = await askAgent(message, relevantMemories, agentType);

    return NextResponse.json({
      response,
      sources: relevantMemories.slice(0, 3),
      agentType,
      message,
      searchType: embedding ? "semantic" : "text",
    });
  } catch (error) {
    console.error("AI Agent error:", error);
    return NextResponse.json(
      { error: "AI agent request failed" },
      { status: 500 }
    );
  }
}
