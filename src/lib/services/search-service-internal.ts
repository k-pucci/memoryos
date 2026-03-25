// lib/services/search-service-internal.ts
import { supabaseAdmin } from '@/lib/supabase/admin';

export class InternalSearchService {
  static async searchMemoriesForUser(
    query: string,
    userId: string,
    embedding?: number[],
    limit: number = 15,
    customThreshold?: number
  ) {
    const searchLimit = limit;
    // Use custom threshold if provided, otherwise auto-calculate
    const threshold = customThreshold ?? (query.length <= 10 ? 0.3 : 0.5);

    let semanticResults: any[] = [];
    let textResults: any[] = [];

    console.log(`🔍 Searching memories for query: "${query}" (threshold: ${threshold})`);

    // Try semantic search first if embedding is provided
    if (embedding && Array.isArray(embedding) && embedding.length === 384) {
      try {
        const { data, error } = await supabaseAdmin.rpc("match_memories", {
          query_embedding: embedding,
          similarity_threshold: threshold,
          match_count: searchLimit,
          user_filter: userId
        });

        if (error) {
          console.error("❌ Semantic search error:", error.message);
        } else if (data && data.length > 0) {
          console.log(`✅ Semantic search found ${data.length} results`);
          semanticResults = data;
        } else {
          console.log("⚠️ Semantic search returned no results");
        }
      } catch (error) {
        console.error("❌ Semantic search failed:", error);
      }
    }

    // ALWAYS try text search as well (not just fallback)
    if (query?.trim()) {
      try {
        const searchTerm = query.trim();

        const { data, error } = await supabaseAdmin
          .from("memories")
          .select("id, title, content, summary, category, memory_type, tags, created_at, updated_at")
          .eq("user_id", userId)
          .or(
            `title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`
          )
          .order("created_at", { ascending: false })
          .limit(searchLimit);

        if (error) {
          console.error("❌ Text search error:", error.message);
        } else if (data && data.length > 0) {
          console.log(`✅ Text search found ${data.length} results`);
          textResults = data;
        } else {
          console.log("⚠️ Text search returned no results");
        }
      } catch (error) {
        console.error("❌ Text search failed:", error);
      }
    }

    // Combine and deduplicate results (semantic results prioritized)
    const seenIds = new Set<string>();
    const combinedResults: any[] = [];

    // Add semantic results first (higher priority)
    for (const result of semanticResults) {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id);
        combinedResults.push(result);
      }
    }

    // Add text results that weren't in semantic results
    for (const result of textResults) {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id);
        combinedResults.push(result);
      }
    }

    console.log(`📊 Combined results: ${combinedResults.length} (semantic: ${semanticResults.length}, text: ${textResults.length})`);

    return combinedResults.slice(0, searchLimit);
  }
}