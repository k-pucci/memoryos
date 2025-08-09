// /src/app/library/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  Clock,
  ArrowUpRight,
  Loader2,
  Plus,
  X,
  Edit,
  Globe,
  FileText,
  Calendar,
  Archive,
  Lightbulb,
  CheckSquare,
  BarChart3,
  Puzzle,
  Rocket,
  GraduationCap,
  Microscope,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";

// Types
interface Memory {
  id: string;
  title: string;
  category: string;
  memory_type: string;
  content: string;
  summary?: string;
  tags?: string[];
  source_url?: string;
  created_at: string;
  updated_at: string;
}

// Memory type to icon mapping
const getMemoryTypeIcon = (memoryType: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    note: <Edit size={14} />,
    document: <FileText size={14} />,
    link: <Globe size={14} />,
    analysis: <BarChart3 size={14} />,
    concept: <Puzzle size={14} />,
    event: <Calendar size={14} />,
    research: <Microscope size={14} />,
    product: <Rocket size={14} />,
    meeting: <Calendar size={14} />,
    learning: <GraduationCap size={14} />,
    idea: <Lightbulb size={14} />,
    task: <CheckSquare size={14} />,
  };

  return iconMap[memoryType.toLowerCase()] || <Archive size={14} />;
};

// Get memory type CSS class name
const getMemoryTypeClass = (memoryType: string, category: string) => {
  const type = memoryType.toLowerCase();
  const cat = category.toLowerCase();

  // Check if we have a specific memory type class
  const memoryTypes = [
    "research",
    "product",
    "meeting",
    "learning",
    "idea",
    "task",
    "note",
    "document",
    "link",
    "analysis",
    "concept",
    "event",
  ];

  if (memoryTypes.includes(type)) {
    return `memory-${type}`;
  } else if (memoryTypes.includes(cat)) {
    return `memory-${cat}`;
  }

  return "memory-note"; // fallback
};

export default function LibraryPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [error, setError] = useState("");

  // Available categories based on your memory types
  const categories = [
    "All",
    "Research",
    "Product",
    "Meeting",
    "Learning",
    "Idea",
    "Task",
    "Note",
    "Document",
    "Link",
    "Analysis",
    "Concept",
    "Event",
  ];

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
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout currentPage="Library">
        <div className="space-y-6 p-4">
          <div className="flex items-center">
            <BookOpen className="text-primary mr-2" size={22} />
            <h1 className="text-2xl font-bold">Library</h1>
          </div>
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
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
          {/* Title and Add Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="text-primary mr-3" size={24} />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Memory Library
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Access your collected knowledge and memories
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/new-memory")}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer flex items-center text-sm font-medium"
            >
              <Plus size={16} className="mr-2" />
              Add Memory
            </button>
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
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={clearSearch}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => handleCategorySelect(category)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {category}
              </button>
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
                <div className="text-center py-20 text-muted-foreground">
                  <BookOpen
                    size={48}
                    className="mx-auto mb-4 text-muted-foreground/30"
                  />
                  <h3 className="text-xl font-medium mb-2 text-foreground">
                    {searchQuery || selectedCategory !== "All"
                      ? "No memories found"
                      : "No memories yet"}
                  </h3>
                  <p className="mb-6 text-muted-foreground max-w-md mx-auto">
                    {searchQuery || selectedCategory !== "All"
                      ? "Try a different search term or category"
                      : "Start building your memory library by adding your first memory"}
                  </p>
                  <button
                    onClick={() => router.push("/new-memory")}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer font-medium"
                  >
                    Add Your First Memory
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {recentMemories.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4 text-foreground">
                        Recent Memories
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {recentMemories.map((memory) => (
                          <MemoryCard
                            key={memory.id}
                            memory={memory}
                            onView={() => router.push(`/memory/${memory.id}`)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {olderMemories.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4 text-foreground">
                        {recentMemories.length > 0
                          ? "Earlier Memories"
                          : "All Memories"}
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {olderMemories.map((memory) => (
                          <MemoryCard
                            key={memory.id}
                            memory={memory}
                            onView={() => router.push(`/memory/${memory.id}`)}
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

// Memory Card Component
interface MemoryCardProps {
  memory: Memory;
  onView: () => void;
}

function MemoryCard({ memory, onView }: MemoryCardProps) {
  const memoryClass = getMemoryTypeClass(memory.memory_type, memory.category);
  const icon = getMemoryTypeIcon(memory.memory_type);
  const displayContent =
    memory.summary ||
    memory.content.substring(0, 120) +
      (memory.content.length > 120 ? "..." : "");

  return (
    <Card
      className="bg-card border-border overflow-hidden relative group hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer card-shadow hover:card-shadow-lg"
      onClick={onView}
    >
      {/* Top accent line */}
      <div
        className={`absolute top-0 left-0 w-full h-1 ${memoryClass}-bg opacity-60`}
      ></div>

      <CardContent className="p-4 pt-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div className={`${memoryClass} opacity-70`}>{icon}</div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${memoryClass}-bg ${memoryClass}`}
            >
              {memory.memory_type}
            </span>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
            <ArrowUpRight size={16} />
          </button>
        </div>

        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 text-base leading-tight">
          {memory.title}
        </h3>

        {displayContent && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
            {displayContent}
          </p>
        )}

        {memory.tags && memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {memory.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md font-medium"
              >
                {tag}
              </span>
            ))}
            {memory.tags.length > 3 && (
              <span className="text-xs text-muted-foreground font-medium">
                +{memory.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${memoryClass}-bg ${memoryClass} opacity-80`}
          >
            {memory.category}
          </span>
          <div className="flex items-center text-muted-foreground">
            <Clock size={12} className="mr-1" />
            <span>
              {formatDistanceToNow(new Date(memory.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
