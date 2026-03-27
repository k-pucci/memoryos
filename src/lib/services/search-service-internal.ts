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
    const threshold = customThreshold ?? (query.length <= 10 ? 0.3 : 0.4);

    // Fetch a larger candidate pool from each source so RRF has enough
    // material to work with. Cap at 50 to avoid excessive DB load.
    const poolSize = Math.min(limit * 2, 50);

    let semanticResults: any[] = [];
    let textResults: any[] = [];

    console.log(`🔍 Hybrid search for: "${query}" (threshold: ${threshold}, pool: ${poolSize})`);

    // Run both searches in parallel
    await Promise.all([
      // --- Semantic search ---
      (async () => {
        if (!embedding || !Array.isArray(embedding) || embedding.length !== 384) return;
        try {
          const { data, error } = await supabaseAdmin.rpc("match_memories", {
            query_embedding: embedding,
            similarity_threshold: threshold,
            match_count: poolSize,
            user_filter: userId,
          });
          if (error) {
            console.error("❌ Semantic search error:", error.message);
          } else if (data?.length > 0) {
            console.log(`✅ Semantic search found ${data.length} results`);
            semanticResults = data;
          } else {
            console.log("⚠️ Semantic search returned no results");
          }
        } catch (err) {
          console.error("❌ Semantic search failed:", err);
        }
      })(),

      // --- Keyword search ---
      (async () => {
        if (!query?.trim()) return;
        try {
          const { data, error } = await supabaseAdmin
            .from("memories")
            .select("id, title, content, summary, category, memory_type, tags, created_at, updated_at, action_items, next_steps, priority, status")
            .eq("user_id", userId)
            .or(
              `title.ilike.%${query.trim()}%,content.ilike.%${query.trim()}%,summary.ilike.%${query.trim()}%`
            )
            .order("created_at", { ascending: false })
            .limit(poolSize);
          if (error) {
            console.error("❌ Keyword search error:", error.message);
          } else if (data?.length > 0) {
            console.log(`✅ Keyword search found ${data.length} results`);
            textResults = data;
          } else {
            console.log("⚠️ Keyword search returned no results");
          }
        } catch (err) {
          console.error("❌ Keyword search failed:", err);
        }
      })(),
    ]);

    // --- Reciprocal Rank Fusion ---
    // Score = Σ 1/(k + rank) across each result list.
    // k=60 is the standard constant from the original RRF paper.
    // A result appearing in both lists scores higher than one appearing in only one.
    const k = 60;
    const scores = new Map<string, { score: number; memory: any }>();

    for (const [rank, result] of semanticResults.entries()) {
      const entry = scores.get(result.id) ?? { score: 0, memory: result };
      entry.score += 1 / (k + rank + 1);
      scores.set(result.id, entry);
    }

    for (const [rank, result] of textResults.entries()) {
      const entry = scores.get(result.id) ?? { score: 0, memory: result };
      entry.score += 1 / (k + rank + 1);
      scores.set(result.id, entry);
    }

    const combined = Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ memory }) => memory);

    console.log(
      `📊 RRF combined: ${combined.length} results ` +
      `(semantic pool: ${semanticResults.length}, keyword pool: ${textResults.length})`
    );

    return combined;
  }
}
