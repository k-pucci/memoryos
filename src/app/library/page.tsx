"use client";

import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen, Search, Clock, ArrowUpRight, Loader2, Plus, X } from "lucide-react";
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
    "All", "Research", "Product", "Meeting", "Learning", "Idea", "Task", "Note", "Document", "Link", "Analysis", "Concept", "Event"
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
          limit: 50 // Get more memories for the library
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
      filtered = filtered.filter(memory => 
        memory.category === selectedCategory || memory.memory_type === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(memory =>
        memory.title.toLowerCase().includes(query) ||
        memory.content.toLowerCase().includes(query) ||
        memory.category.toLowerCase().includes(query) ||
        memory.memory_type.toLowerCase().includes(query) ||
        (memory.tags && memory.tags.some(tag => tag.toLowerCase().includes(query)))
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

  const getMemoryTypeColor = (memoryType: string, category: string) => {
    // Color mapping based on memory type and category
    const colorMap: { [key: string]: string } = {
      research: "blue",
      product: "purple",
      meeting: "emerald",
      learning: "amber",
      idea: "pink",
      task: "indigo",
      note: "cyan",
      document: "green",
      link: "orange",
      analysis: "violet",
      concept: "teal",
      event: "rose"
    };
    
    return colorMap[memoryType.toLowerCase()] || colorMap[category.toLowerCase()] || "gray";
  };

  const getTypeIcon = (memoryType: string) => {
    const iconMap: { [key: string]: string } = {
      note: "📝",
      document: "📄",
      link: "🔗",
      analysis: "📊",
      concept: "🧩",
      event: "📅",
      research: "🔬",
      product: "🚀",
      meeting: "📅",
      learning: "🎓",
      idea: "💡",
      task: "✅"
    };
    
    return iconMap[memoryType.toLowerCase()] || "📋";
  };

  // Group memories by recency
  const groupMemoriesByRecency = (memories: Memory[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentMemories = memories.filter(memory => 
      new Date(memory.created_at) >= thisWeek
    );

    const olderMemories = memories.filter(memory => 
      new Date(memory.created_at) < thisWeek
    );

    return { recentMemories, olderMemories };
  };

  if (isLoading) {
    return (
      <Layout currentPage="Library">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout currentPage="Library">
        <div className="space-y-6">
          <div className="flex items-center">
            <BookOpen className="text-purple-400 mr-2" size={22} />
            <h1 className="text-2xl font-bold">Library</h1>
          </div>
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  const { recentMemories, olderMemories } = groupMemoriesByRecency(filteredMemories);

  return (
    <Layout currentPage="Library">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="text-purple-400 mr-2" size={22} />
            <div>
              <h1 className="text-2xl font-bold">Memory Library</h1>
              <p className="text-gray-400 text-sm">Access your collected knowledge and memories</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push('/new-memory')}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Memory
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search your memories..."
            className="bg-slate-800/50 border-slate-700 text-white pl-10 h-12 rounded-xl focus:border-purple-500 focus:ring focus:ring-purple-500/20 transition-all"
          />
          {searchQuery && (
            <button 
              className="absolute right-3 top-[12px] text-gray-400 hover:text-white cursor-pointer"
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
              className={`px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer ${
                selectedCategory === category 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                  : 'bg-slate-800/50 text-gray-300 border border-slate-700 hover:bg-slate-700/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Results count */}
        {searchQuery && (
          <p className="text-gray-400 text-sm">
            Found {filteredMemories.length} {filteredMemories.length === 1 ? 'memory' : 'memories'} 
            {searchQuery ? ` for "${searchQuery}"` : ''}
            {selectedCategory !== "All" ? ` in ${selectedCategory}` : ''}
          </p>
        )}
        
        {/* Memory Items */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          {filteredMemories.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <BookOpen size={40} className="mx-auto mb-4 text-gray-500 opacity-50" />
              <h3 className="text-xl font-medium mb-2">
                {searchQuery || selectedCategory !== "All" ? "No memories found" : "No memories yet"}
              </h3>
              <p className="mb-6">
                {searchQuery || selectedCategory !== "All" 
                  ? "Try a different search term or category" 
                  : "Start building your memory library by adding your first memory"
                }
              </p>
              <button
                onClick={() => router.push('/new-memory')}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer"
              >
                Add Your First Memory
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {recentMemories.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Recent Memories</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentMemories.map((memory) => (
                      <MemoryCard key={memory.id} memory={memory} onView={() => router.push(`/memory/${memory.id}`)} />
                    ))}
                  </div>
                </div>
              )}
              
              {olderMemories.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">All Memories</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {olderMemories.map((memory) => (
                      <MemoryCard key={memory.id} memory={memory} onView={() => router.push(`/memory/${memory.id}`)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
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
  const color = getMemoryTypeColor(memory.memory_type, memory.category);
  const icon = getTypeIcon(memory.memory_type);
  const displayContent = memory.summary || memory.content.substring(0, 100) + (memory.content.length > 100 ? '...' : '');
  
  return (
    <Card className="bg-slate-800/50 border-slate-700 overflow-hidden relative group hover:shadow-lg hover:border-purple-500/30 transition-all cursor-pointer" onClick={onView}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-${color}-500`}></div>
      <CardContent className="p-4 pt-5">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm">{icon}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs bg-${color}-500/20 text-${color}-300`}>
              {memory.memory_type}
            </span>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
            <ArrowUpRight size={16} />
          </button>
        </div>
        
        <h3 className="font-bold text-white mb-2 line-clamp-2">{memory.title}</h3>
        
        {displayContent && (
          <p className="text-sm text-gray-300 mb-3 line-clamp-2">{displayContent}</p>
        )}
        
        {memory.tags && memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {memory.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-1.5 py-0.5 bg-slate-700 text-xs text-gray-300 rounded">
                {tag}
              </span>
            ))}
            {memory.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{memory.tags.length - 3}</span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className={`px-2 py-1 rounded-full bg-${color}-500/10 text-${color}-300`}>
            {memory.category}
          </span>
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            <span>{formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getMemoryTypeColor(memoryType: string, category: string) {
  const colorMap: { [key: string]: string } = {
    research: "blue",
    product: "purple",
    meeting: "emerald",
    learning: "amber",
    idea: "pink",
    task: "indigo",
    note: "cyan",
    document: "green",
    link: "orange",
    analysis: "violet",
    concept: "teal",
    event: "rose"
  };
  
  return colorMap[memoryType.toLowerCase()] || colorMap[category.toLowerCase()] || "gray";
}

function getTypeIcon(memoryType: string) {
  const iconMap: { [key: string]: string } = {
    note: "📝",
    document: "📄",
    link: "🔗",
    analysis: "📊",
    concept: "🧩",
    event: "📅",
    research: "🔬",
    product: "🚀",
    meeting: "📅",
    learning: "🎓",
    idea: "💡",
    task: "✅"
  };
  
  return iconMap[memoryType.toLowerCase()] || "📋";
}
