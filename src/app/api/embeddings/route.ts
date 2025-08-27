// src/app/api/embeddings/route.ts
import { EmbeddingService } from '@/lib/services/embedding-service';
import { ApiResponse } from '@/lib/api/response-utils';
import { validateEmbeddingInput } from '@/lib/api/validation-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = validateEmbeddingInput(body);
    
    const embedding = await EmbeddingService.generateEmbedding(text);
    
    return ApiResponse.success({ embedding });
  } catch (error: any) {
    console.error("Embedding API error:", error);
    return ApiResponse.serverError({
      error: "Failed to generate embedding"
    });
  }
}
