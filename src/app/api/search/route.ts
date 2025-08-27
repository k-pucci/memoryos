// src/app/api/search/route.ts
import { SearchService } from '@/lib/services/search-service';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { ApiResponse } from '@/lib/api/response-utils';
import { validateSearchInput } from '@/lib/api/validation-utils';

export async function POST(request: Request) {
  const startTime = Date.now();
  let searchType: 'semantic' | 'text' = 'text';
  
  try {
    const body = await request.json();
    const input = validateSearchInput(body);
    
    const result = await SearchService.searchMemories(input);
    searchType = result.searchType;
    
    // Track search analytics
    await AnalyticsService.trackSearchPerformed({
      user_id: input.user_id,
      query: input.query,
      exclude_ids: input.exclude_ids || [],
      resultsCount: result.resultsCount,
      searchType: result.searchType,
      hasEmbedding: !!input.embedding,
      startTime,
      limit: input.limit || 10
    });
    
    return ApiResponse.success(result);
  } catch (error: any) {
    console.error("Search error:", error);
    
    await AnalyticsService.trackSearchFailed(searchType, error, startTime);
    
    return ApiResponse.serverError({ error: "Search failed" });
  } finally {
    await AnalyticsService.shutdown();
  }
}