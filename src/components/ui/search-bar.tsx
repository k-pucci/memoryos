// components/ui/search-bar.tsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import { debounce } from "@/lib/search-utils";

export interface SearchResult {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  [key: string]: any; // Allow additional properties
}

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  onResultClick?: (result: SearchResult) => void;
  onViewAllResults?: (query: string) => void;
  searchFunction?: (query: string) => Promise<SearchResult[]>;
  renderResult?: (result: SearchResult) => React.ReactNode;
  className?: string;
  showDropdown?: boolean;
  minQueryLength?: number;
  maxResults?: number;
  debounceMs?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact";
}

export function SearchBar({
  placeholder = "Search...",
  value: controlledValue,
  onChange: controlledOnChange,
  onSearch,
  onResultClick,
  onViewAllResults,
  searchFunction,
  renderResult,
  className = "",
  showDropdown = true,
  minQueryLength = 2,
  maxResults = 5,
  debounceMs = 300,
  size = "md",
  variant = "default",
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Use controlled or internal state
  const searchQuery =
    controlledValue !== undefined ? controlledValue : internalValue;
  const setSearchQuery = controlledOnChange || setInternalValue;

  // Handle clicks outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length >= minQueryLength && searchFunction) {
        setIsSearching(true);
        try {
          const results = await searchFunction(query);
          setSearchResults(results.slice(0, maxResults));
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, debounceMs),
    [searchFunction, minQueryLength, maxResults, debounceMs]
  );

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);

    if (showDropdown && newQuery.trim().length >= minQueryLength) {
      setShowResults(true);
      debouncedSearch(newQuery);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    clearSearch();
    onResultClick?.(result);
  };

  // Handle view all results
  const handleViewAllResults = () => {
    if (searchQuery.trim()) {
      onViewAllResults?.(searchQuery);
      clearSearch();
    }
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery);
      } else if (onViewAllResults) {
        handleViewAllResults();
      }
    }
  };

  // Handle focus
  const handleFocus = () => {
    if (
      showDropdown &&
      searchQuery.trim().length >= minQueryLength &&
      searchResults.length > 0
    ) {
      setShowResults(true);
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-9 text-sm";
      case "lg":
        return "h-14 text-lg";
      default:
        return "h-12";
    }
  };

  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case "compact":
        return "rounded-md";
      default:
        return "rounded-xl card-shadow";
    }
  };

  // Default result renderer
  const defaultRenderResult = (result: SearchResult) => (
    <div
      key={result.id}
      className="p-3 border-b border-border last:border-b-0 hover:bg-secondary/20 hover:text-foreground cursor-pointer"
      onClick={() => handleResultClick(result)}
    >
      <div className="flex justify-between mb-1">
        <h4 className="font-medium text-foreground truncate">{result.title}</h4>
      </div>
      {(result.content || result.summary) && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {result.summary ||
            (result.content &&
              result.content.substring(0, 120) +
                (result.content.length > 120 ? "..." : ""))}
        </p>
      )}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-muted-foreground" />
        </div>
        <Input
          ref={searchInputRef}
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`
            bg-card border-border text-foreground pl-10 
            focus:border-primary focus:ring focus:ring-primary/20 transition-all
            ${getSizeClasses()} ${getVariantClasses()}
          `}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <X size={16} />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && showResults && (
        <div
          ref={searchResultsRef}
          className="absolute top-full left-0 w-full mt-2 bg-popover border border-border rounded-lg card-shadow-lg overflow-hidden z-20"
        >
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto">
              {searchResults.map((result) =>
                renderResult
                  ? renderResult(result)
                  : defaultRenderResult(result)
              )}
              {onViewAllResults && (
                <Button
                  variant="ghost"
                  onClick={handleViewAllResults}
                  className="w-full text-center text-primary hover:text-primary/80 text-sm font-medium"
                >
                  See all results for "{searchQuery}"
                </Button>
              )}
            </div>
          ) : searchQuery.length >= minQueryLength ? (
            <div className="p-6 text-center text-muted-foreground">
              <p>No results found for "{searchQuery}"</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
