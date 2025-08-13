//src/app/library/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { SearchFilters, FilterState } from "@/components/shared/SearchFilters";
import { Search, Clock, Loader2, X, Archive, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { MemoryCard } from "@/components/shared/MemoryCard";
import { SearchResultCard } from "@/components/shared/SearchResultCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ViewControls } from "@/components/shared/ViewControls";
import { DashboardLayout } from "@/components/layout/PageLayout";
import { Memory } from "@/lib/memory-utils";
import { performAdvancedSearch, SearchOptions } from "@/lib/search-utils";

// Recent Searches Component
interface RecentSearchesProps {
  searches: string[];
  onUseSearch: (query: string) => void;
  onClear: () => void;
}

function RecentSearches({
  searches,
  onUseSearch,
  onClear,
}: RecentSearchesProps) {
  if (searches.length === 0) return null;

  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-muted-foreground flex items-center">
          <Clock size={14} className="mr-1" /> Quick access to recent searches
        </p>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((query, index) => (
          <Button
            key={index}
            variant="secondary"
            size="sm"
            onClick={() => onUseSearch(query)}
            className="h-auto py-1.5 px-3 text-sm rounded-full"
          >
            <Search size={12} className="mr-1" />
            {query}
          </Button>
        ))}
      </div>
    </div>
  );
}

function LibraryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    category: null,
    memory_type: null,
    tags: [],
    date_from: null,
    date_to: null,
  });

  // Mode: 'browse' or 'search'
  const [mode, setMode] = useState<"browse" | "search">("browse");

  // Handle URL parameters on mount
  useEffect(() => {
    const query = searchParams.get("q");
    const category = searchParams.get("category");

    if (query) {
      setSearchQuery(query);
      setMode("search");
      setShowAdvancedFilters(false);
    } else {
      setSearchQuery("");
      setMode("browse");
    }

    if (category) {
      setAdvancedFilters((prev) => ({ ...prev, category }));
    }

    // Load recent searches
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    fetchAvailableTags();
  }, [searchParams]);

  // Perform search when URL params change
  useEffect(() => {
    const query = searchParams.get("q");
    const category = searchParams.get("category");

    if (query || category) {
      performSearch(query || "", category);
    } else {
      fetchMemories();
    }
  }, [searchParams]);

  // Filter memories when in browse mode
  useEffect(() => {
    if (mode === "browse") {
      filterMemoriesWithAdvancedFilters();
    }
  }, [memories, advancedFilters, mode]);

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch("/api/memories/tags");
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

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
          limit: 50,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch memories");
      }

      const data = await response.json();
      setMemories(data.results || []);
      setMode("browse");
    } catch (error: any) {
      console.error("Error fetching memories:", error);
      setError("Failed to load memories");
    } finally {
      setIsLoading(false);
    }
  };

  // Advanced filtering for browse mode
  const filterMemoriesWithAdvancedFilters = () => {
    let filtered = [...memories];

    // Filter by category
    if (advancedFilters.category) {
      filtered = filtered.filter(
        (memory) =>
          memory.category === advancedFilters.category ||
          memory.memory_type === advancedFilters.category?.toLowerCase()
      );
    }

    // Filter by memory type
    if (advancedFilters.memory_type) {
      filtered = filtered.filter(
        (memory) => memory.memory_type === advancedFilters.memory_type
      );
    }

    // Filter by tags
    if (advancedFilters.tags.length > 0) {
      filtered = filtered.filter((memory) =>
        memory.tags?.some((tag) => advancedFilters.tags.includes(tag))
      );
    }

    // Filter by date range
    if (advancedFilters.date_from) {
      filtered = filtered.filter(
        (memory) =>
          new Date(memory.created_at) >= new Date(advancedFilters.date_from!)
      );
    }

    if (advancedFilters.date_to) {
      filtered = filtered.filter(
        (memory) =>
          new Date(memory.created_at) <= new Date(advancedFilters.date_to!)
      );
    }

    setFilteredMemories(filtered);
  };

  // Advanced search for search mode
  const performSearch = async (
    searchQuery: string,
    categoryFilter: string | null = null
  ) => {
    setIsSearching(true);
    setError("");
    setMode("search");

    try {
      const searchOptions: SearchOptions = {
        query: searchQuery,
        category: categoryFilter || advancedFilters.category,
        memory_type: advancedFilters.memory_type,
        tags:
          advancedFilters.tags.length > 0 ? advancedFilters.tags : undefined,
        date_from: advancedFilters.date_from,
        date_to: advancedFilters.date_to,
        limit: 50,
      };

      const searchResults = await performAdvancedSearch(searchOptions);
      setFilteredMemories(searchResults);
    } catch (error: any) {
      console.error("Error searching memories:", error);
      setError(error.message || "Search failed");
      setFilteredMemories([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMemoryClick = (id: string) => {
    router.push(`/memory/${id}`);
  };

  const useRecentSearch = (recentQuery: string) => {
    router.push(`/library?q=${encodeURIComponent(recentQuery)}`);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const applyAdvancedFilters = () => {
    if (mode === "search") {
      performSearch(searchQuery);
    } else {
      filterMemoriesWithAdvancedFilters();
    }
    setShowAdvancedFilters(false);
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      category: null,
      memory_type: null,
      tags: [],
      date_from: null,
      date_to: null,
    });

    if (mode === "search") {
      performSearch(searchQuery);
    } else {
      filterMemoriesWithAdvancedFilters();
    }
  };

  const hasActiveAdvancedFilters = () => {
    return (
      advancedFilters.category ||
      advancedFilters.memory_type ||
      advancedFilters.tags.length > 0 ||
      advancedFilters.date_from ||
      advancedFilters.date_to
    );
  };

  const clearSearch = () => {
    router.push("/library");
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (advancedFilters.category) count++;
    if (advancedFilters.memory_type) count++;
    if (advancedFilters.tags.length > 0) count++;
    if (advancedFilters.date_from || advancedFilters.date_to) count++;
    return count;
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

  // Render memory list item for list view
  const renderMemoryListItem = (memory: Memory) => (
    <div
      key={memory.id}
      onClick={() => handleMemoryClick(memory.id)}
      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all card-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-2 truncate">
            {memory.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {memory.content}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-primary/10 text-primary rounded">
              {memory.category}
            </span>
            <span>{new Date(memory.created_at).toLocaleDateString()}</span>
            {memory.tags && memory.tags.length > 0 && (
              <span>{memory.tags.length} tags</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render memories section
  const renderMemoriesSection = (
    memories: Memory[],
    title: string,
    icon: React.ReactNode
  ) => {
    if (memories.length === 0) return null;

    return (
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground mb-4">
          {icon}
          {title}
        </h2>
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {memories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onClick={handleMemoryClick}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">{memories.map(renderMemoryListItem)}</div>
        )}
      </div>
    );
  };

  if (isLoading && mode === "browse") {
    return (
      <DashboardLayout
        currentPage="Library"
        title="Memory Hub"
        description="Your unified memory collection and search"
      >
        <div className="px-6 pb-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading your library...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        currentPage="Library"
        title="Memory Hub"
        description="Your unified memory collection and search"
      >
        <div className="px-6 pb-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Group memories by recency for browse mode
  const { recentMemories, olderMemories } =
    mode === "browse"
      ? groupMemoriesByRecency(filteredMemories)
      : { recentMemories: [], olderMemories: filteredMemories };

  return (
    <DashboardLayout
      currentPage="Library"
      title={mode === "search" ? "Search Results" : "Memory Hub"}
      description={
        mode === "search"
          ? `${filteredMemories.length} results${
              searchQuery ? ` for "${searchQuery}"` : ""
            }`
          : "Your unified memory collection and search"
      }
      actions={
        <ViewControls
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showFilters={showAdvancedFilters}
          onToggleFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          activeFiltersCount={
            hasActiveAdvancedFilters() ? getActiveFiltersCount() : 0
          }
        />
      }
    >
      <div className="px-6 pb-6">
        {/* Search Context & Controls */}
        <div className="flex flex-col gap-2">
          {/* Search breadcrumb */}
          {mode === "search" && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Search size={14} />
                <span>Search results</span>
                {searchQuery && (
                  <>
                    <span>for</span>
                    <span className="font-medium text-foreground px-2 py-1 bg-primary/10 rounded">
                      "{searchQuery}"
                    </span>
                  </>
                )}
                {hasActiveAdvancedFilters() && (
                  <>
                    <span>•</span>
                    <span>{getActiveFiltersCount()} filters applied</span>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="ml-auto"
              >
                <X size={14} className="mr-1" />
                Clear search
              </Button>
            </div>
          )}

          {/* Recent Searches */}
          {mode === "browse" && (
            <RecentSearches
              searches={recentSearches}
              onUseSearch={useRecentSearch}
              onClear={clearRecentSearches}
            />
          )}

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="bg-card border rounded-lg p-4">
              <SearchFilters
                filters={advancedFilters}
                availableTags={availableTags}
                onFiltersChange={setAdvancedFilters}
                onApply={applyAdvancedFilters}
                onClear={clearAdvancedFilters}
                onClose={() => setShowAdvancedFilters(false)}
                title={
                  mode === "search"
                    ? "Refine Search Results"
                    : "Filter Memories"
                }
                variant="embedded"
                showBorder={false}
                showHeader={true}
                showActions={true}
                showTags={false}
              />
            </div>
          )}

          {/* Active filters display */}
          {hasActiveAdvancedFilters() && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {advancedFilters.category && (
                <div className="px-3 py-1.5 rounded-full text-sm bg-primary/20 text-primary border border-primary/30 flex items-center">
                  Category: {advancedFilters.category}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        category: null,
                      }))
                    }
                    className="ml-2 h-auto w-auto p-1"
                  >
                    <X size={14} />
                  </Button>
                </div>
              )}
              {advancedFilters.memory_type && (
                <div className="px-3 py-1.5 rounded-full text-sm bg-primary/20 text-primary border border-primary/30 flex items-center">
                  Type: {advancedFilters.memory_type}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        memory_type: null,
                      }))
                    }
                    className="ml-2 h-auto w-auto p-1"
                  >
                    <X size={14} />
                  </Button>
                </div>
              )}
              {advancedFilters.tags.length > 0 && (
                <div className="px-3 py-1.5 rounded-full text-sm bg-primary/20 text-primary border border-primary/30 flex items-center">
                  {advancedFilters.tags.length} tags
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        tags: [],
                      }))
                    }
                    className="ml-2 h-auto w-auto p-1"
                  >
                    <X size={14} />
                  </Button>
                </div>
              )}
              {(advancedFilters.date_from || advancedFilters.date_to) && (
                <div className="px-3 py-1.5 rounded-full text-sm bg-primary/20 text-primary border border-primary/30 flex items-center">
                  Date range
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        date_from: null,
                        date_to: null,
                      }))
                    }
                    className="ml-2 h-auto w-auto p-1"
                  >
                    <X size={14} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        {isSearching ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground">
                Searching your memories...
              </p>
            </div>
          </div>
        ) : filteredMemories.length === 0 ? (
          <EmptyState
            icon={<Archive size={48} />}
            title={
              mode === "search"
                ? "No memories found"
                : hasActiveAdvancedFilters()
                ? "No memories match your filters"
                : "No memories yet"
            }
            description={
              mode === "search"
                ? "Try a different search term or adjust your filters"
                : hasActiveAdvancedFilters()
                ? "Try removing some filters to see more results"
                : "Start building your memory collection"
            }
            action={{
              label: mode === "search" ? "Clear Search" : "Browse All Memories",
              onClick:
                mode === "search"
                  ? clearSearch
                  : () => {
                      setAdvancedFilters({
                        category: null,
                        memory_type: null,
                        tags: [],
                        date_from: null,
                        date_to: null,
                      });
                      fetchMemories();
                    },
            }}
          />
        ) : mode === "search" ? (
          <div className="space-y-4">
            {filteredMemories.map((memory) => (
              <SearchResultCard
                key={memory.id}
                memory={{
                  ...memory,
                  similarity: memory.similarity || 0,
                }}
                onClick={handleMemoryClick}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {renderMemoriesSection(
              recentMemories,
              "Recent Memories",
              <Clock size={20} className="text-primary" />
            )}
            {renderMemoriesSection(
              olderMemories,
              recentMemories.length > 0 ? "Earlier Memories" : "All Memories",
              <Archive size={20} className="text-primary" />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout
          currentPage="Library"
          title="Memory Hub"
          description="Loading your memory collection..."
        >
          <div className="px-6 pb-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                <p className="text-muted-foreground">Loading your library...</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      }
    >
      <LibraryPageContent />
    </Suspense>
  );
}
