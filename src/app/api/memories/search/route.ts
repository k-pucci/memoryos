// /src/app/api/memories/search/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Setup Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    console.log("🔵 /api/memories/search hit");

    const {
      query,
      limit = 10,
      exclude_ids = [],
      embedding,
    } = await request.json();
    console.log("🟢 Received query:", query);

    // If embedding is provided, use semantic search
    if (embedding && Array.isArray(embedding) && embedding.length === 384) {
      console.log("🧠 Using semantic search");

      try {
        // Use vector similarity search
        const { data, error } = await supabase.rpc("match_memories", {
          query_embedding: embedding,
          similarity_threshold: 0.6, // Lower threshold for related memories
          match_count: limit,
        });

        if (error) throw error;

        // Filter out excluded IDs
        const filteredResults =
          data?.filter((memory: any) => !exclude_ids.includes(memory.id)) || [];

        console.log(`✅ Found ${filteredResults.length} semantic results`);
        return NextResponse.json({
          results: filteredResults,
          searchType: "semantic",
        });
      } catch (vectorError) {
        console.error(
          "❌ Vector search failed, falling back to text search:",
          vectorError
        );
        // Fall through to text search
      }
    }

    // Fallback to text-based search
    console.log("📝 Using text search");

    let queryBuilder = supabase
      .from("memories")
      .select(
        "id, title, content, summary, category, memory_type, tags, created_at, updated_at"
      )
      .limit(limit);

    // If query is provided, search in title and content
    if (query && query.trim()) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,content.ilike.%${query}%,summary.ilike.%${query}%`
      );
    }

    // Exclude specified IDs
    if (exclude_ids.length > 0) {
      queryBuilder = queryBuilder.not("id", "in", `(${exclude_ids.join(",")})`);
    }

    // Order by most recent
    queryBuilder = queryBuilder.order("created_at", { ascending: false });

    const { data, error } = await queryBuilder;

    if (error) throw error;

    console.log(`✅ Found ${data?.length || 0} text search results`);

    // For related memories, add a mock similarity score for text search
    const resultsWithSimilarity = (data || []).map(
      (memory: any, index: number) => ({
        ...memory,
        similarity: 0.8 - index * 0.1, // Decreasing similarity based on order
      })
    );

    return NextResponse.json({
      results: resultsWithSimilarity,
      searchType: "text",
    });
  } catch (error: any) {
    console.error("🔴 Error in search route:", error);
    return NextResponse.json(
      { error: "Failed to search memories", details: error.message },
      { status: 500 }
    );
  }
}
