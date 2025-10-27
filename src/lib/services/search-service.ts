// lib/services/search-service.ts - Improved search implementation
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SearchInput } from '@/lib/api/validation-utils';

export class SearchService {
  static async searchMemories(input: SearchInput) {
    const { 
      query, 
      limit = 10, 
      exclude_ids = [], 
      embedding, 
      threshold = 0.7,
      user_id 
    } = input;

    // Validate we have either a query or embedding
    if (!query?.trim() && !embedding) {
      console.log("❌ No search query or embedding provided");
      return {
        results: [],
        searchType: "empty" as const,
        resultsCount: 0,
        query: query || "",
        count: 0
      };
    }

    // Try semantic search first if embedding is provided
    if (embedding && Array.isArray(embedding) && embedding.length === 384) {
      console.log("🧠 Attempting semantic search", {
        embeddingLength: embedding.length,
        threshold,
        userId: user_id
      });
      
      try {
        const { data, error } = await supabaseAdmin.rpc("match_memories", {
          query_embedding: embedding,
          similarity_threshold: threshold,
          match_count: limit,
          user_filter: user_id // Now supported by updated SQL function
        });

        if (error) {
          console.error("❌ RPC match_memories error:", error);
          throw error;
        }

        if (!data) {
          console.log("⚠️ No data returned from match_memories");
          throw new Error("No data returned from semantic search");
        }

        const filteredResults = data.filter(
          (memory: any) => !exclude_ids.includes(memory.id)
        );

        console.log(`✅ Semantic search found ${filteredResults.length} results`);

        return {
          results: filteredResults,
          searchType: "semantic" as const,
          resultsCount: filteredResults.length,
          query: query || "",
          count: filteredResults.length
        };
      } catch (vectorError) {
        console.error("❌ Vector search failed:", {
          error: vectorError,
          embeddingLength: embedding?.length,
          userId: user_id
        });
        
        // Fall through to text search only if we have a query
        if (!query?.trim()) {
          return {
            results: [],
            searchType: "failed" as const,
            resultsCount: 0,
            query: query || "",
            count: 0
          };
        }
      }
    }

    // Text search - only if we have a query
    if (!query?.trim()) {
      console.log("❌ No text query provided for text search");
      return {
        results: [],
        searchType: "text" as const, // Changed from "empty"
        resultsCount: 0,
        query: "",
        count: 0
      };
    }

    console.log("📝 Using text search", {
      query: query.trim(),
      userId: user_id,
      excludeIds: exclude_ids
    });

    try {
      let queryBuilder = supabaseAdmin
        .from("memories")
        .select(
          "id, title, content, summary, category, memory_type, tags, created_at, updated_at"
        )
        .limit(limit);

      // CRITICAL: Filter by user first
      if (user_id) {
        queryBuilder = queryBuilder.eq("user_id", user_id);
      }

      // Apply text search
      const searchTerm = query.trim();
      queryBuilder = queryBuilder.or(
        `title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`
      );

      // Exclude specified IDs
      if (exclude_ids.length > 0) {
        queryBuilder = queryBuilder.not("id", "in", `(${exclude_ids.join(",")})`);
      }

      // Order by relevance (you might want to improve this)
      queryBuilder = queryBuilder.order("created_at", { ascending: false });

      const { data, error } = await queryBuilder;

      if (error) {
        console.error("❌ Text search error:", error);
        throw error;
      }

      const resultsCount = data?.length || 0;
      console.log(`✅ Text search found ${resultsCount} results`);

      // Add mock similarity scores for consistency
      const resultsWithSimilarity = (data || []).map(
        (memory: any, index: number) => ({
          ...memory,
          similarity: Math.max(0.5, 0.9 - index * 0.05), // Better mock scoring
        })
      );

      return {
        results: resultsWithSimilarity,
        searchType: "text" as const,
        resultsCount,
        query,
        count: resultsCount
      };
    } catch (textError) {
      console.error("❌ Text search failed:", textError);
      throw textError;
    }
  }

  // Helper method for debugging
  static async testSemanticSearch(embedding: number[], user_id?: string) {
    console.log("🔍 Testing semantic search directly");
    
    try {
      const { data, error } = await supabaseAdmin.rpc("match_memories", {
        query_embedding: embedding,
        similarity_threshold: 0.1, // Very low threshold for testing
        match_count: 5,
      });

      console.log("Test results:", { data, error });
      return { data, error };
    } catch (error) {
      console.error("Test failed:", error);
      return { data: null, error };
    }
  }
}