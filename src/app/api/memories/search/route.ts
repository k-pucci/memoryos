// app/api/memories/search/route.ts - Fixed with user authentication
import { SearchService } from '@/lib/services/search-service';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { ApiResponse } from '@/lib/api/response-utils';
import { validateSearchInput } from '@/lib/api/validation-utils';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const startTime = Date.now();
  let searchType: 'semantic' | 'text' = 'text';
  let analyticsSearchType: 'semantic' | 'text' = 'text';
  
  try {
    console.log(" /api/memories/search hit");
    
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const body = await request.json();
    const input = validateSearchInput(body);
    
    // CRITICAL: Add user_id after validation
    const searchInput = {
      ...input,
      user_id: user.id
    };
    
    const result = await SearchService.searchMemories(searchInput);
    
    // Ensure searchType is either 'semantic' or 'text' for analytics
    analyticsSearchType = result.searchType === 'semantic' || result.searchType === 'text' 
      ? result.searchType 
      : 'text';
    
    // Track search analytics
    await AnalyticsService.trackSearchPerformed({
      user_id: user.id,
      query: searchInput.query,
      exclude_ids: searchInput.exclude_ids || [],
      resultsCount: result.resultsCount,
      searchType: analyticsSearchType,
      hasEmbedding: !!searchInput.embedding,
      startTime,
      limit: searchInput.limit || 10
    });

    return ApiResponse.success({
      results: result.results,
      searchType: result.searchType,
    });
  } catch (error: any) {
    console.error(" Error in memories search route:", error);
    
    await AnalyticsService.trackSearchFailed(analyticsSearchType, error, startTime);
    
    return ApiResponse.serverError({
      error: "Failed to search memories",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await AnalyticsService.shutdown();
  }
}