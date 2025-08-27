// lib/services/search-service.ts - Search operations extracted
import { supabase } from '@/lib/api/clients';
import { SearchInput } from '@/lib/api/validation-utils';

export class SearchService {
  static async searchMemories(input: SearchInput) {
    const { query, limit = 10, exclude_ids = [], embedding, threshold = 0.7 } = input;
    
    // Try semantic search first if embedding is provided
    if (embedding && Array.isArray(embedding) && embedding.length === 384) {
      console.log("🧠 Using semantic search");
      
      try {
        const { data, error } = await supabase.rpc("match_memories", {
          query_embedding: embedding,
          similarity_threshold: threshold,
          match_count: limit,
        });

        if (error) throw error;

        const filteredResults = data?.filter(
          (memory: any) => !exclude_ids.includes(memory.id)
        ) || [];
        
        console.log(`✅ Found ${filteredResults.length} semantic results`);
        
        return {
          results: filteredResults,
          searchType: "semantic" as const,
          resultsCount: filteredResults.length,
          query,
          count: filteredResults.length
        };
      } catch (vectorError) {
        console.error("❌ Vector search failed, falling back to text search:", vectorError);
        // Fall through to text search
      }
    }

    // Text search fallback
    console.log("📝 Using text search");
    
    let queryBuilder = supabase
      .from("memories")
      .select(
        "id, title, content, summary, category, memory_type, tags, created_at, updated_at"
      )
      .limit(limit);

    if (query && query.trim()) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,content.ilike.%${query}%,summary.ilike.%${query}%`
      );
    }

    if (exclude_ids.length > 0) {
      queryBuilder = queryBuilder.not("id", "in", `(${exclude_ids.join(",")})`);
    }

    queryBuilder = queryBuilder.order("created_at", { ascending: false });

    const { data, error } = await queryBuilder;

    if (error) throw error;

    const resultsCount = data?.length || 0;
    console.log(`✅ Found ${resultsCount} text search results`);

    // Add mock similarity scores for consistency
    const resultsWithSimilarity = (data || []).map(
      (memory: any, index: number) => ({
        ...memory,
        similarity: 0.8 - index * 0.1,
      })
    );

    return {
      results: resultsWithSimilarity,
      searchType: "text" as const,
      resultsCount,
      query,
      count: resultsCount
    };
  }
}