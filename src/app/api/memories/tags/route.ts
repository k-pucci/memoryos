// app/api/memories/tags/route.ts
import { MemoryService } from '@/lib/services/memory-service';
import { ApiResponse, withAuth } from '@/lib/api/response-utils';

export async function GET(request: Request) {
  return withAuth(request, async (request, user) => {
    try {
      const tags = await MemoryService.getAllTags(user.id);
      return ApiResponse.success({ tags });
    } catch (error: any) {
      console.error('Error processing tags request:', error);
      return ApiResponse.serverError({
        error: 'Error processing tags request',
        message: error.message
      });
    }
  });
}