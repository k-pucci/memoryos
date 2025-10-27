// app/api/memories/[id]/route.ts - AFTER refactor with auth
import { MemoryService } from '@/lib/services/memory-service';
import { ApiResponse, withAuth } from '@/lib/api/response-utils';
import { validateUpdateMemory } from '@/lib/api/validation-utils';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  return withAuth(request, async (request, user) => {
    try {
      const { id } = await context.params;
      const memory = await MemoryService.getMemory(id, user.id);
      return ApiResponse.success(memory);
    } catch (error: any) {
      return ApiResponse.error(error.message, 404);
    }
  });
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  return withAuth(request, async (request, user) => {
    try {
      const { id } = await context.params;
      const body = await request.json();
      const input = validateUpdateMemory(body);
      
      const result = await MemoryService.updateMemory(id, input, user.id);
      
      return ApiResponse.success({
        id: result.memory.id,
        message: "Memory updated successfully",
        hasSummary: result.hasSummary,
        hasEmbedding: result.hasEmbedding,
      });
    } catch (error: any) {
      return ApiResponse.serverError(error);
    }
  });
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  return withAuth(request, async (request, user) => {
    try {
      const { id } = await context.params;
      const result = await MemoryService.deleteMemory(id, user.id);
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.serverError(error);
    }
  });
}