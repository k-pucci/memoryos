import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const {
      query,
      embedding,
      threshold = 0.7,
      limit = 10,
    } = await request.json();

    if (!query || query.trim() === "") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    let results = [];

    // If embedding is provided, use semantic search
    if (embedding && Array.isArray(embedding) && embedding.length === 384) {
      try {
        const { data, error } = await supabase.rpc("match_memories", {
          query_embedding: embedding,
          similarity_threshold: threshold,
          match_count: limit,
        });

        if (error) throw error;
        results = data || [];
      } catch (error) {
        console.error("Vector search error:", error);
        // Fallback to text search
        results = await performTextSearch(query, limit);
      }
    } else {
      // Fallback to text search
      results = await performTextSearch(query, limit);
    }

    return NextResponse.json({
      results,
      query,
      count: results.length,
      searchType: embedding ? "semantic" : "text",
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

async function performTextSearch(query: string, limit: number) {
  const { data, error } = await supabase
    .from("memories")
    .select("id, title, content, category, tags, created_at")
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Text search error:", error);
    return [];
  }

  return data || [];
}
