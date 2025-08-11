// src/app/search/page.tsx

"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Layout from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search as SearchIcon,
  Loader2,
  ExternalLink,
  X,
  Clock,
  Filter,
  Plus,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Memory,
  MemoryResult,
  getMemoryTypeIcon,
  formatMemoryDate,
  MEMORY_CATEGORIES,
} from "@/lib/memory-utils";
import {
  debounce,
  performAdvancedSearch,
  SearchOptions,
} from "@/lib/search-utils";

interface FilterState {
  category: string | null;
  memory_type: string | null;
  tags: string[];
  date_from: string | null;
  date_to: string | null;
}

// Separate component that uses useSearchParams
function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemoryResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    memory_type: null,
    tags: [],
    date_from: null,
    date_to: null,
  });

  // Set initial state from URL params
  useEffect(() => {
    const searchQuery = searchParams.get("q");
    const categoryParam = searchParams.get("category");

    if (searchQuery) {
      setQuery(searchQuery);
    }

    if (categoryParam) {
      setFilters((prev) => ({ ...prev, category: categoryParam }));
    }

    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    // Fetch available tags for filtering
    fetchAvailableTags();

    // Perform initial search if we have a query or category
    if (searchQuery || categoryParam) {
      performSearch(searchQuery || "", categoryParam);
    }
  }, [searchParams]);

  // Fetch available tags for filtering
  const fetchAvailableTags = async () => {
    try {
      const response = await fetch("/api/memory/tags");
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  // Create a debounced search function using shared utility
  const debouncedSearch = React.useCallback(
    debounce((searchQuery: string, categoryFilter: string | null) => {
      performSearch(searchQuery, categoryFilter);
    }, 300),
    []
  );

  // Function to handle search input changes with real-time results
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Only trigger search if there's a meaningful query (2+ characters)
    if (newQuery.trim().length >= 2) {
      debouncedSearch(newQuery, filters.category);
    } else if (newQuery.trim().length === 0) {
      // If query is cleared but category is present, search by category only
      if (filters.category) {
        debouncedSearch("", filters.category);
      } else {
        // If no query and no category, clear results
        setResults([]);
      }
    }
  };

  // Function to perform the actual search using shared utility
  const performSearch = async (
    searchQuery: string,
    categoryFilter: string | null = null
  ) => {
    // Don't search if both query and category are empty
    if (
      !searchQuery &&
      !categoryFilter &&
      filters.tags.length === 0 &&
      !filters.memory_type
    )
      return;

    setIsSearching(true);
    setError("");

    try {
      const searchOptions: SearchOptions = {
        query: searchQuery,
        category: categoryFilter,
        memory_type: filters.memory_type,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        date_from: filters.date_from,
        date_to: filters.date_to,
        limit: 20,
      };

      const searchResults = await performAdvancedSearch(searchOptions);
      setResults(searchResults);
    } catch (error: any) {
      console.error("Error searching memories:", error);
      setError(error.message || "Search failed");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to save a search to recent searches
  const saveToRecentSearches = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Add to front of array and remove duplicates
    const updatedSearches = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
  };

  // Function to handle search button click
  const handleSearch = () => {
    performSearch(query, filters.category);
    if (query.trim()) {
      saveToRecentSearches(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Function to clear the category filter
  const clearCategory = () => {
    setFilters((prev) => ({ ...prev, category: null }));
    if (query) {
      performSearch(query, null);
    } else {
      setResults([]);
    }
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setFilters({
      category: null,
      memory_type: null,
      tags: [],
      date_from: null,
      date_to: null,
    });

    // Re-search with just the query
    if (query) {
      performSearch(query, null);
    } else {
      setResults([]);
    }
  };

  // Function to use a recent search
  const useRecentSearch = (recentQuery: string) => {
    setQuery(recentQuery);
    performSearch(recentQuery, filters.category);

    // Focus the search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Function to clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  // Function to toggle a tag in the filters
  const toggleTag = (tag: string) => {
    setFilters((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];

      return { ...prev, tags: newTags };
    });
  };

  // Function to apply all filters
  const applyFilters = () => {
    performSearch(query, filters.category);
    setShowFilters(false);
  };

  // Helper function to check if filters are active
  const hasActiveFilters = () => {
    return (
      filters.category ||
      filters.memory_type ||
      filters.tags.length > 0 ||
      filters.date_from ||
      filters.date_to
    );
  };

  // Helper to render a match percentage as a background color
  const getMatchBackgroundClass = (similarity: number) => {
    if (similarity >= 0.9)
      return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
    if (similarity >= 0.8)
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
    if (similarity >= 0.7)
      return "bg-purple-500/20 text-purple-600 dark:text-purple-400";
    if (similarity >= 0.6)
      return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
    return "bg-red-500/20 text-red-600 dark:text-red-400";
  };

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 space-y-6 p-6 pb-0">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold brand-terracotta">
              Search Memories
            </h1>
            <p className="text-muted-foreground mt-2">
              Find exactly what you're looking for in your memory collection
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg hover:bg-brand-coral/10 hover:text-brand-coral hover:border-brand-coral/20 transition-all cursor-pointer"
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters() && (
                <span className="w-2 h-2 rounded-full bg-primary"></span>
              )}
            </button>
            <button
              onClick={() => router.push("/new-memory")}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-all text-primary cursor-pointer"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Memory</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground mb-4">
            <SearchIcon size={20} className="text-primary" />
            Search
          </h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={18} className="text-muted-foreground" />
            </div>
            <Input
              ref={searchInputRef}
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search your memories..."
              className="bg-card border-border text-foreground pl-10 h-12 rounded-xl focus:border-primary focus:ring focus:ring-primary/20 transition-all card-shadow"
            />
            {query && (
              <button
                className="absolute right-3 top-[12px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setQuery("");
                  if (filters.category) {
                    performSearch("", filters.category);
                  } else {
                    setResults([]);
                  }
                  if (searchInputRef.current) {
                    searchInputRef.current.focus();
                  }
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Recent searches */}
        {recentSearches.length > 0 && !query && (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground flex items-center">
                <Clock size={14} className="mr-1" /> Recent searches
              </p>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((recentQuery, index) => (
                <button
                  key={index}
                  onClick={() => useRecentSearch(recentQuery)}
                  className="px-3 py-1.5 text-sm bg-muted text-foreground hover:bg-brand-coral/10 hover:text-brand-coral transition-colors rounded-full"
                >
                  {recentQuery}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-4 card-shadow">
            <div className="flex justify-between items-center">
              <h3 className="text-foreground font-medium">Advanced Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-foreground">Category</label>
                <select
                  className="w-full bg-background border border-border text-foreground rounded-md p-2 focus:border-primary focus:ring focus:ring-primary/20"
                  value={filters.category || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value || null,
                    }))
                  }
                >
                  <option value="">All Categories</option>
                  {MEMORY_CATEGORIES.slice(1).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-foreground">Memory Type</label>
                <select
                  className="w-full bg-background border border-border text-foreground rounded-md p-2 focus:border-primary focus:ring focus:ring-primary/20"
                  value={filters.memory_type || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      memory_type: e.target.value || null,
                    }))
                  }
                >
                  <option value="">All Types</option>
                  <option value="note">Note</option>
                  <option value="concept">Concept</option>
                  <option value="document">Document</option>
                  <option value="link">Link</option>
                  <option value="event">Event</option>
                  <option value="analysis">Analysis</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground">Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 20).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-full transition-colors",
                      filters.tags.includes(tag)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-brand-coral/10 hover:text-brand-coral"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-foreground">From Date</label>
                <Input
                  type="date"
                  className="bg-background border-border text-foreground"
                  value={filters.date_from || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      date_from: e.target.value || null,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-foreground">To Date</label>
                <Input
                  type="date"
                  className="bg-background border-border text-foreground"
                  value={filters.date_to || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      date_to: e.target.value || null,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-border">
              <button
                onClick={clearAllFilters}
                className="px-3 py-1.5 border border-border text-muted-foreground hover:bg-brand-coral/10 hover:text-brand-coral hover:border-brand-coral/20 rounded-md transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={applyFilters}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {filters.category && (
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">
              Filtering by category:
            </span>
            <div className="px-3 py-1.5 rounded-full text-sm bg-primary/20 text-primary border border-primary/30 flex items-center">
              {filters.category}
              <button
                onClick={clearCategory}
                className="ml-2 text-primary hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Scrollable Results */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isSearching ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground">
                Searching your memories...
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 pt-4 h-full">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
                {results.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground text-sm">
                        Found {results.length}{" "}
                        {results.length === 1 ? "result" : "results"}
                        {query ? ` for "${query}"` : ""}
                        {filters.category
                          ? ` in category "${filters.category}"`
                          : ""}
                      </p>
                    </div>

                    {results.map((memory) => (
                      <Card
                        key={memory.id}
                        className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer card-shadow hover:card-shadow-lg"
                        onClick={() => router.push(`/memory/${memory.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h3 className="text-xl font-semibold text-foreground">
                                {memory.title}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                  {memory.category}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {formatMemoryDate(memory.created_at)}
                                </span>
                              </div>
                            </div>

                            <p className="text-muted-foreground">
                              {memory.summary ||
                                memory.content.substring(0, 150) +
                                  (memory.content.length > 150 ? "..." : "")}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-1">
                              {memory.tags &&
                                memory.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                            </div>

                            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
                              <div className="flex items-center gap-1">
                                {getMemoryTypeIcon(memory.memory_type)}
                                <span>{memory.memory_type}</span>
                              </div>

                              {memory.source_url && (
                                <button
                                  onClick={(
                                    e: React.MouseEvent<HTMLButtonElement>
                                  ) => {
                                    e.stopPropagation();
                                    if (memory.source_url) {
                                      window.open(
                                        memory.source_url,
                                        "_blank",
                                        "noopener,noreferrer"
                                      );
                                    }
                                  }}
                                  className="text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                                >
                                  <ExternalLink size={14} />
                                  <span>Source</span>
                                </button>
                              )}

                              {memory.similarity < 1 && (
                                <div
                                  className={cn(
                                    "px-2 py-1 rounded-full text-xs",
                                    getMatchBackgroundClass(memory.similarity)
                                  )}
                                >
                                  {Math.round(memory.similarity * 100)}% match
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  !isSearching &&
                  (query || hasActiveFilters()) && (
                    <EmptyState
                      icon={<SearchIcon size={48} />}
                      title="No memories found"
                      description="Try a different search term or add a new memory"
                      action={{
                        label: "Add New Memory",
                        onClick: () => router.push("/new-memory"),
                      }}
                    />
                  )
                )}

                {!isSearching && !query && !hasActiveFilters() && (
                  <EmptyState
                    icon={<SearchIcon size={48} />}
                    title="Search your memory stack"
                    description="Start typing to search through your memories"
                  />
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function SearchPage() {
  return (
    <Layout currentPage="Search">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading search...</p>
            </div>
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </Layout>
  );
}
