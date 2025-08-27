// /src/app/api/memories/search/route.ts
import { SearchService } from '@/lib/services/search-service';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { ApiResponse } from '@/lib/api/response-utils';
import { validateSearchInput } from '@/lib/api/validation-utils';

export async function POST(request: Request) {
  const startTime = Date.now();
  let searchType: 'semantic' | 'text' = 'text';
  
  try {
    console.log("🔵 /api/memories/search hit");
    
    const body = await request.json();
    const input = validateSearchInput(body);
    
    const result = await SearchService.searchMemories(input);
    searchType = result.searchType;
    
    // Track success
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

    return ApiResponse.success({
      results: result.results,
      searchType: result.searchType,
    });
  } catch (error: any) {
    console.error("🔴 Error in search route:", error);
    
    await AnalyticsService.trackSearchFailed(searchType, error, startTime);
    
    return ApiResponse.serverError({
      error: "Failed to search memories",
      details: error.message
    });
  } finally {
    await AnalyticsService.shutdown();
  }
}