// app/api/memory/tags/route.ts
import { MemoryService } from '@/lib/services/memory-service';
import { ApiResponse } from '@/lib/api/response-utils';

export async function GET() {
  try {
    const tags = await MemoryService.getAllTags();
    return ApiResponse.success({ tags });
  } catch (error: any) {
    console.error('Error processing tags request:', error);
    return ApiResponse.serverError({
      error: 'Error processing tags request',
      message: error.message
    });
  }
}