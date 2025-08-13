import { MemoryResult } from "./memory-utils";

// Simple debounce implementation - used in layout and search page
export function debounce<F extends (...args: any[]) => any>(
  func: F,
  wait: number
) {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<F>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Shared search function for memory queries
export const performMemorySearch = async (
  query: string,
  limit: number = 5
): Promise<MemoryResult[]> => {
  if (!query.trim()) return [];

  try {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        limit: limit,
      }),
    });

    if (!response.ok) {
      throw new Error("Search failed");
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error searching memories:", error);
    return [];
  }
};

// Search API endpoint options
export interface SearchOptions {
  query: string;
  category?: string | null;
  memory_type?: string | null;
  tags?: string[];
  date_from?: string | null;
  date_to?: string | null;
  limit?: number;
}

// Advanced search function with filters (for search page)
export const performAdvancedSearch = async (
  options: SearchOptions
): Promise<MemoryResult[]> => {
  try {
    const response = await fetch("/api/memories/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error("Search failed");
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error searching memories:", error);
    return [];
  }
};
