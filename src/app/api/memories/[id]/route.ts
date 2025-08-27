// app/api/memories/[id]/route.ts - AFTER refactor (79% smaller!)
import { MemoryService } from '@/lib/services/memory-service';
import { ApiResponse } from '@/lib/api/response-utils';
import { validateUpdateMemory } from '@/lib/api/validation-utils';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    const memory = await MemoryService.getMemory(id);
    return ApiResponse.success(memory);
  } catch (error: any) {
    return ApiResponse.error(error.message, 404);
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const input = validateUpdateMemory(body);
    
    const result = await MemoryService.updateMemory(id, input);
    
    return ApiResponse.success({
      id: result.memory.id,
      message: "Memory updated successfully",
      hasSummary: result.hasSummary,
      hasEmbedding: result.hasEmbedding,
    });
  } catch (error: any) {
    return ApiResponse.serverError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    const result = await MemoryService.deleteMemory(id);
    return ApiResponse.success(result);
  } catch (error: any) {
    return ApiResponse.serverError(error);
  }
}