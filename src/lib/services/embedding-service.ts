// lib/services/embedding-service.ts - Embedding operations extracted
import { pipeline } from "@xenova/transformers";

export class EmbeddingService {
  private static embedder: any = null;

  static async generateEmbedding(text: string): Promise<number[]> {
    // Initialize embedder if not already done
    if (!this.embedder) {
      console.log("🤖 Loading embedding model...");
      this.embedder = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
      console.log("✅ Embedding model loaded!");
    }

    const output = await this.embedder(text, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(output.data);
  }
}