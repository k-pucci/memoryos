// lib/services/search-service-internal.ts
import { supabaseAdmin } from '@/lib/supabase/admin';

export class InternalSearchService {
  static async searchMemoriesForUser(
    query: string,
    userId: string,
    embedding?: number[],
    limit: number = 15
  ) {
    const { query: searchQuery, limit: searchLimit = 10, exclude_ids = [], threshold = 0.7 } = {
      query,
      limit,
      exclude_ids: [],
      threshold: 0.7
    };

    // Try semantic search first if embedding is provided
    if (embedding && Array.isArray(embedding) && embedding.length === 384) {
      try {
        const { data, error } = await supabaseAdmin.rpc("match_memories", {
          query_embedding: embedding,
          similarity_threshold: threshold,
          match_count: searchLimit,
          user_filter: userId
        });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (error) {
        console.error("Semantic search failed:", error);
      }
    }

    // Text search fallback
    if (!query?.trim()) {
      return [];
    }

    let queryBuilder = supabaseAdmin
      .from("memories")
      .select("id, title, content, summary, category, memory_type, tags, created_at, updated_at")
      .eq("user_id", userId)
      .limit(searchLimit);

    const searchTerm = query.trim();
    queryBuilder = queryBuilder.or(
      `title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`
    );

    queryBuilder = queryBuilder.order("created_at", { ascending: false });

    const { data, error } = await queryBuilder;
    
    if (error) throw error;
    
    return data || [];
  }
}