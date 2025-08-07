"use client";
import { useState, useCallback } from "react";
import { pipeline } from "@xenova/transformers";

let embedder: any = null;

export function useEmbeddings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const initializeEmbedder = useCallback(async () => {
    if (embedder) return embedder;

    setIsLoading(true);
    try {
      console.log("🤖 Loading embedding model...");
      embedder = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
      console.log("✅ Embedding model loaded!");
      setIsReady(true);
      return embedder;
    } catch (error) {
      console.error("❌ Failed to load embedding model:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateEmbedding = useCallback(
    async (text: string): Promise<number[]> => {
      try {
        const model = await initializeEmbedder();
        const output = await model(text, { pooling: "mean", normalize: true });
        return Array.from(output.data);
      } catch (error) {
        console.error("Embedding generation error:", error);
        // Fallback: return a simple keyword-based vector
        return generateKeywordVector(text);
      }
    },
    [initializeEmbedder]
  );

  const searchMemories = useCallback(
    async (query: string, memories: any[], threshold: number = 0.7) => {
      try {
        const queryEmbedding = await generateEmbedding(query);

        // If we have a valid embedding, use semantic search via API
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            embedding: queryEmbedding,
            threshold,
          }),
        });

        const data = await response.json();
        return data.results || [];
      } catch (error) {
        console.error("Search error:", error);
        // Fallback: simple text search
        return memories
          .filter(
            (memory) =>
              memory.title.toLowerCase().includes(query.toLowerCase()) ||
              memory.content.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 10);
      }
    },
    [generateEmbedding]
  );

  return {
    generateEmbedding,
    searchMemories,
    isLoading,
    isReady,
    initializeEmbedder,
  };
}

// Fallback: Simple keyword-based vector
function generateKeywordVector(text: string): number[] {
  const keywords = text
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2);
  const vector = new Array(384).fill(0);

  keywords.forEach((keyword, index) => {
    const hash = hashString(keyword);
    vector[hash % 384] += 1;
  });

  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map((val) => val / magnitude) : vector;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
