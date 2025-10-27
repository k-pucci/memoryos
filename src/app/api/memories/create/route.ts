// app/api/memories/create/route.ts 
import { MemoryService } from '@/lib/services/memory-service';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { ApiResponse, withAuth } from '@/lib/api/response-utils';
import { validateCreateMemory } from '@/lib/api/validation-utils';

export async function POST(request: Request) {
  return withAuth(request, async (request, user) => {
    try {
      const body = await request.json();
      const input = validateCreateMemory(body);
      
      // Add user_id to the input - this ensures the memory is associated with the authenticated user
      const memoryInput = {
        ...input,
        user_id: user.id,
      };
      
      const result = await MemoryService.createMemory(memoryInput);
      
      // Track success
      await AnalyticsService.trackMemoryCreated({ 
        ...memoryInput, 
        memory: result.memory,
        user_id: user.id 
      });
      
      return ApiResponse.success({
        id: result.memory.id,
        message: "Memory created successfully",
        hasEmbedding: result.hasEmbedding,
        hasSummary: result.hasSummary,
      });
    } catch (error: any) {
      await AnalyticsService.trackMemoryCreationFailed({ 
        message: error.message, // Extract just the message
        user_id: user.id 
      });
      return ApiResponse.serverError(error);
    } finally {
      await AnalyticsService.shutdown();
    }
  });
}