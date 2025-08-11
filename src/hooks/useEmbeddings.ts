// src/hooks/useEmbeddings.ts
"use client";
import { useState, useCallback } from "react";

export function useEmbeddings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(true); // API is always "ready"

  const generateEmbedding = useCallback(
    async (text: string): Promise<number[]> => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/embeddings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        return data.embedding;
      } catch (error) {
        console.error("Embedding generation error:", error);
        // Fallback: return a simple keyword-based vector
        return generateKeywordVector(text);
      } finally {
        setIsLoading(false);
      }
    },
    []
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

  const initializeEmbedder = useCallback(async () => {
    // This is now a no-op since initialization happens server-side
    // But we keep it for compatibility with existing code
    setIsReady(true);
    return true;
  }, []);

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
