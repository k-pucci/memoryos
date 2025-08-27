// app/api/memories/create/route.ts 
import { MemoryService } from '@/lib/services/memory-service';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { ApiResponse } from '@/lib/api/response-utils';
import { validateCreateMemory } from '@/lib/api/validation-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = validateCreateMemory(body);
    
    const result = await MemoryService.createMemory(input);
    
    // Track success
    await AnalyticsService.trackMemoryCreated({ ...input, memory: result.memory });
    
    return ApiResponse.success({
      id: result.memory.id,
      message: "Memory created successfully",
      hasEmbedding: result.hasEmbedding,
      hasSummary: result.hasSummary,
    });
  } catch (error: any) {
    await AnalyticsService.trackMemoryCreationFailed(error);
    return ApiResponse.serverError(error);
  } finally {
    await AnalyticsService.shutdown();
  }
}