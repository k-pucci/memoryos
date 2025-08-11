//src/app/library/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Clock, Loader2, X, Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";
import { MemoryCard } from "@/components/shared/MemoryCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Memory, MEMORY_CATEGORIES } from "@/lib/memory-utils";

export default function LibraryPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [error, setError] = useState("");

  // Fetch memories on component mount
  useEffect(() => {
    fetchMemories();
  }, []);

  // Filter memories when search or category changes
  useEffect(() => {
    filterMemories();
  }, [memories, searchQuery, selectedCategory]);

  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/memories/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "",
          limit: 50, // Get more memories for the library
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch memories");
      }

      const data = await response.json();
      setMemories(data.results || []);
    } catch (error: any) {
      console.error("Error fetching memories:", error);
      setError("Failed to load memories");
    } finally {
      setIsLoading(false);
    }
  };

  const filterMemories = () => {
    let filtered = [...memories];

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (memory) =>
          memory.category === selectedCategory ||
          memory.memory_type === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (memory) =>
          memory.title.toLowerCase().includes(query) ||
          memory.content.toLowerCase().includes(query) ||
          memory.category.toLowerCase().includes(query) ||
          memory.memory_type.toLowerCase().includes(query) ||
          (memory.tags &&
            memory.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }

    setFilteredMemories(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleMemoryClick = (id: string) => {
    router.push(`/memory/${id}`);
  };

  // Group memories by recency
  const groupMemoriesByRecency = (memories: Memory[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentMemories = memories.filter(
      (memory) => new Date(memory.created_at) >= thisWeek
    );

    const olderMemories = memories.filter(
      (memory) => new Date(memory.created_at) < thisWeek
    );

    return { recentMemories, olderMemories };
  };

  if (isLoading) {
    return (
      <Layout currentPage="Library">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading your library...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout currentPage="Library">
        <div className="flex flex-col h-full max-h-screen overflow-hidden">
          <div className="flex-shrink-0 space-y-6 p-6 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold brand-terracotta">
                  Memory Library
                </h1>
                <p className="text-muted-foreground mt-2">
                  Access your collected knowledge and memories
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="p-6 pt-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
                {error}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const { recentMemories, olderMemories } =
    groupMemoriesByRecency(filteredMemories);

  return (
    <Layout currentPage="Library">
      <div className="flex flex-col h-full max-h-screen overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 space-y-6 p-6 pb-0">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold brand-terracotta">
                Memory Library
              </h1>
              <p className="text-muted-foreground mt-2">
                Access your collected knowledge and memories
              </p>
            </div>
            <div className="flex gap-3"></div>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-muted-foreground" />
            </div>
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search your memories..."
              className="bg-card border-border text-foreground pl-10 h-12 rounded-xl focus:border-primary focus:ring focus:ring-primary/20 transition-all card-shadow"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <X size={18} />
              </Button>
            )}
          </div>

          {/* Categories - Using Button component */}
          <div className="flex flex-wrap gap-2">
            {MEMORY_CATEGORIES.map((category, index) => (
              <Button
                key={index}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategorySelect(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Results count */}
          {(searchQuery || selectedCategory !== "All") && (
            <p className="text-muted-foreground text-sm">
              Found {filteredMemories.length}{" "}
              {filteredMemories.length === 1 ? "memory" : "memories"}
              {searchQuery ? ` for "${searchQuery}"` : ""}
              {selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}
            </p>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 pt-4">
              {filteredMemories.length === 0 ? (
                <EmptyState
                  icon={<Archive size={48} />}
                  title={
                    searchQuery || selectedCategory !== "All"
                      ? "No memories found"
                      : "No memories yet"
                  }
                  description={
                    searchQuery || selectedCategory !== "All"
                      ? "Try a different search term or category"
                      : "Start building your memory library"
                  }
                  action={{
                    label: "Add Your First Memory",
                    onClick: () => router.push("/new-memory"),
                  }}
                />
              ) : (
                <div className="space-y-8">
                  {recentMemories.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2 text-foreground mb-4">
                        <Clock size={20} className="text-primary" />
                        Recent Memories
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {recentMemories.map((memory) => (
                          <MemoryCard
                            key={memory.id}
                            memory={memory}
                            onClick={handleMemoryClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {olderMemories.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2 text-foreground mb-4">
                        <Archive size={20} className="text-primary" />
                        {recentMemories.length > 0
                          ? "Earlier Memories"
                          : "All Memories"}
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {olderMemories.map((memory) => (
                          <MemoryCard
                            key={memory.id}
                            memory={memory}
                            onClick={handleMemoryClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
}
