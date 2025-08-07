import { NextRequest, NextResponse } from "next/server";
import { askAgent } from "@/lib/groq";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Add interface for memory type
interface Memory {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  similarity?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { message, agentType = "helper", embedding } = await request.json();

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log(`🤖 AI Agent request: "${message}" (type: ${agentType})`);
    console.log(`🔍 Embedding provided: ${embedding ? "Yes" : "No"}`);

    let relevantMemories: Memory[] = [];
    let searchType = "text";

    // Try semantic search first if embedding is provided
    if (embedding && Array.isArray(embedding) && embedding.length === 384) {
      try {
        console.log("🔍 Using semantic search...");
        const { data, error } = await supabase.rpc("match_memories", {
          query_embedding: embedding,
          match_threshold: 0.4,
          match_count: 5,
          filter_category: null,
        });

        if (!error && data && data.length > 0) {
          relevantMemories = data;
          searchType = "semantic";
          console.log(
            `✅ Semantic search found ${relevantMemories.length} memories`
          );
        } else {
          console.log(
            "⚠️ Semantic search returned no results, falling back to text search"
          );
          if (error) console.error("Semantic search error:", error);
        }
      } catch (error) {
        console.error("❌ Semantic search error:", error);
      }
    } else {
      console.log("📝 No valid embedding provided, using text search");
    }

    // Fallback to text search if semantic search failed or no embedding
    if (relevantMemories.length === 0) {
      console.log("🔍 Using text search fallback...");
      const { data, error } = await supabase
        .from("memories")
        .select("id, title, content, category, tags, created_at")
        .or(`title.ilike.%${message}%,content.ilike.%${message}%`)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Text search error:", error);
      } else {
        relevantMemories = data || [];
        searchType = "text";
        console.log(`📝 Text search found ${relevantMemories.length} memories`);
      }
    }

    // Log what memories we're sending to Groq
    console.log("📤 Sending to Groq:", {
      memoriesCount: relevantMemories.length,
      searchType,
      memoryTitles: relevantMemories.map((m: Memory) => m.title), // ← Fixed with type annotation
    });

    // Get AI response
    const response = await askAgent(message, relevantMemories, agentType);

    return NextResponse.json({
      response,
      sources: relevantMemories.slice(0, 3),
      agentType,
      message,
      searchType,
      debug: {
        memoriesFound: relevantMemories.length,
        searchType,
        memoryTitles: relevantMemories.map((m: Memory) => m.title), // ← Fixed with type annotation
      },
    });
  } catch (error) {
    console.error("❌ AI Agent error:", error);
    return NextResponse.json(
      { error: "AI agent request failed" },
      { status: 500 }
    );
  }
}
