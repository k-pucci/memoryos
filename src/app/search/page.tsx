"use client";

import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { 
  Search as SearchIcon, 
  BookOpen, 
  Globe, 
  FileText, 
  Edit, 
  Archive, 
  Calendar, 
  Loader2, 
  ExternalLink, 
  X, 
  Clock,
  Filter
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

// Simple debounce implementation
function debounce<F extends (...args: any[]) => any>(func: F, wait: number) {
  let timeout: NodeJS.Timeout;
  return function(this: any, ...args: Parameters<F>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

interface MemoryResult {
  id: string;
  title: string;
  category: string;
  memory_type: string;
  content: string;
  summary: string;
  tags: string[];
  source_url: string | null;
  created_at: string;
  updated_at: string;
  similarity: number;
}

interface FilterState {
  category: string | null;
  memory_type: string | null;
  tags: string[];
  date_from: string | null;
  date_to: string | null;
}

export default function SearchPage() {
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
    date_to: null
  });

  // Set initial state from URL params
  useEffect(() => {
    const searchQuery = searchParams.get("q");
    const categoryParam = searchParams.get("category");
    
    if (searchQuery) {
      setQuery(searchQuery);
    }
    
    if (categoryParam) {
      setFilters(prev => ({ ...prev, category: categoryParam }));
    }
    
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
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

  // Create a debounced search function
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

  // Function to perform the actual search
  const performSearch = async (searchQuery: string, categoryFilter: string | null = null) => {
    // Don't search if both query and category are empty
    if (!searchQuery && !categoryFilter && filters.tags.length === 0 && !filters.memory_type) return;
    
    setIsSearching(true);
    setError("");
    
    try {
      const response = await fetch("/api/memories/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: searchQuery,
          category: categoryFilter,
          memory_type: filters.memory_type,
          tags: filters.tags.length > 0 ? filters.tags : undefined,
          date_from: filters.date_from,
          date_to: filters.date_to,
          limit: 20 
        }),
      });
      
      if (!response.ok) {
        throw new Error("Search failed");
      }
      
      const data = await response.json();
      setResults(data.results || []);
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
    const updatedSearches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
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
    setFilters(prev => ({ ...prev, category: null }));
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
      date_to: null
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
    localStorage.removeItem('recentSearches');
  };

  // Function to toggle a tag in the filters
  const toggleTag = (tag: string) => {
    setFilters(prev => {
      const newTags = prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag) 
        : [...prev.tags, tag];
      
      return { ...prev, tags: newTags };
    });
  };

  // Function to apply all filters
  const applyFilters = () => {
    performSearch(query, filters.category);
    setShowFilters(false);
  };

  // Function to get icon for memory type
  const getMemoryTypeIcon = (memoryType: string) => {
    switch (memoryType.toLowerCase()) {
      case "note":
        return <Edit size={16} />;
      case "link":
        return <Globe size={16} />;
      case "document":
        return <FileText size={16} />;
      case "analysis":
        return <SearchIcon size={16} />;
      case "concept":
        return <BookOpen size={16} />;
      case "event":
        return <Calendar size={16} />;
      default:
        return <Archive size={16} />;
    }
  };

  // Helper function to check if filters are active
  const hasActiveFilters = () => {
    return filters.category || filters.memory_type || filters.tags.length > 0 || filters.date_from || filters.date_to;
  };

  // Helper to render a match percentage as a background color
  const getMatchBackgroundClass = (similarity: number) => {
    if (similarity >= 0.9) return "bg-green-500/20 text-green-300";
    if (similarity >= 0.8) return "bg-blue-500/20 text-blue-300";
    if (similarity >= 0.7) return "bg-purple-500/20 text-purple-300";
    if (similarity >= 0.6) return "bg-amber-500/20 text-amber-300";
    return "bg-red-500/20 text-red-300";
  };

  return (
    <Layout currentPage="Search">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SearchIcon className="text-purple-400 mr-2" size={22} />
            <h1 className="text-2xl font-bold">Search Memories</h1>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-700 text-gray-300 hover:bg-slate-700 transition-colors"
          >
            <Filter size={16} />
            <span>Filters</span>
            {hasActiveFilters() && (
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            )}
          </button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon size={18} className="text-gray-400" />
          </div>
          <Input
            ref={searchInputRef}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search your memories..."
            className="bg-slate-800/50 border-slate-700 text-white pl-10 h-12 rounded-xl focus:border-purple-500 focus:ring focus:ring-purple-500/20 transition-all"
          />
          {query && (
            <button 
              className="absolute right-3 top-[12px] text-gray-400 hover:text-white"
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
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-xl blur-sm"></div>
        </div>
        
        {/* Recent searches */}
        {recentSearches.length > 0 && !query && (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm text-gray-400 flex items-center">
                <Clock size={14} className="mr-1" /> Recent searches
              </p>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((recentQuery, index) => (
                <button
                  key={index}
                  onClick={() => useRecentSearch(recentQuery)}
                  className="px-2 py-1 text-sm bg-slate-800 text-gray-300 hover:bg-slate-700 rounded-md transition-colors"
                >
                  {recentQuery}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Advanced filters panel */}
        {showFilters && (
          <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-white font-medium">Advanced Filters</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Category</label>
                <select 
                  className="w-full bg-slate-900/50 border-slate-700 text-white rounded-md p-2"
                  value={filters.category || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || null }))}
                >
                  <option value="">All Categories</option>
                  <option value="Research">Research</option>
                  <option value="Product">Product</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Learning">Learning</option>
                  <option value="Idea">Idea</option>
                  <option value="Task">Task</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Memory Type</label>
                <select 
                  className="w-full bg-slate-900/50 border-slate-700 text-white rounded-md p-2"
                  value={filters.memory_type || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, memory_type: e.target.value || null }))}
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
              <label className="text-sm text-gray-300">Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 20).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 text-xs rounded-full ${
                      filters.tags.includes(tag)
                        ? "bg-purple-500/80 text-white hover:bg-purple-500/60"
                        : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                    } transition-colors`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">From Date</label>
                <Input
                  type="date"
                  className="bg-slate-900/50 border-slate-700 text-white"
                  value={filters.date_from || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value || null }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">To Date</label>
                <Input
                  type="date"
                  className="bg-slate-900/50 border-slate-700 text-white"
                  value={filters.date_to || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value || null }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-700">
              <button
                onClick={clearAllFilters}
                className="px-3 py-1.5 border border-slate-700 text-gray-300 hover:bg-slate-700 rounded-md transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={applyFilters}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-md hover:opacity-90 transition-opacity"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
        
        {filters.category && (
          <div className="flex items-center">
            <span className="text-sm text-gray-300 mr-2">Filtering by category:</span>
            <div className="px-3 py-1.5 rounded-full text-sm bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center">
              {filters.category}
              <button 
                onClick={clearCategory}
                className="ml-2 text-purple-300 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}
        
        <div className="h-[calc(100vh-280px)]">
          {isSearching ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {results.length > 0 ? (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-300 text-sm">
                      Found {results.length} {results.length === 1 ? 'result' : 'results'}
                      {query ? ` for "${query}"` : ''}
                      {filters.category ? ` in category "${filters.category}"` : ''}
                    </p>
                    <button
                      onClick={() => router.push('/new-memory')}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      + Add new memory
                    </button>
                  </div>
                  
                  {results.map((memory) => (
                    <Card 
                      key={memory.id} 
                      className="bg-slate-800/50 border-slate-700 hover:border-purple-500/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/memory/${memory.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="text-xl font-semibold text-white">{memory.title}</h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-gray-300">
                                {memory.category}
                              </span>
                              <span className="text-sm text-gray-400">
                                {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-gray-300">{memory.summary || memory.content.substring(0, 150) + (memory.content.length > 150 ? '...' : '')}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-1">
                            {memory.tags && memory.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-slate-700 text-xs text-gray-300 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-400 pt-2 border-t border-slate-700">
                            <div className="flex items-center gap-1">
                              {getMemoryTypeIcon(memory.memory_type)}
                              <span>{memory.memory_type}</span>
                            </div>
                            
                            {memory.source_url && (
                              <button
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  if (memory.source_url) { // Add null check
                                    window.open(memory.source_url, "_blank", "noopener,noreferrer");
                                  }
                                }}
                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                              >
                                <ExternalLink size={14} />
                                <span>Source</span>
                              </button>
                            )}
                            
                            {memory.similarity < 1 && (
                              <div className={`px-2 py-1 rounded-full text-xs ${getMatchBackgroundClass(memory.similarity)}`}>
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
                !isSearching && (query || hasActiveFilters()) && (
                  <div className="text-center py-20 text-gray-400">
                    <SearchIcon size={40} className="mx-auto mb-4 text-gray-500 opacity-50" />
                    <h3 className="text-xl font-medium mb-2">No memories found</h3>
                    <p className="mb-6">Try a different search term or add a new memory</p>
                    <button
                      onClick={() => router.push('/new-memory')}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                    >
                      Add New Memory
                    </button>
                  </div>
                )
              )}
              
              {!isSearching && !query && !hasActiveFilters() && (
                <div className="text-center py-20 text-gray-400">
                  <SearchIcon size={40} className="mx-auto mb-4 text-gray-500 opacity-50" />
                  <h3 className="text-xl font-medium mb-2">Search your memory stack</h3>
                  <p>Start typing to search through your memories</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}