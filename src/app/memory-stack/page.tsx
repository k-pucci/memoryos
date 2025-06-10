"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Plus, MoreHorizontal, Loader2, Edit, Trash2, Search, ExternalLink } from "lucide-react";
import Layout from "@/components/layout";
import { useRouter } from "next/navigation";

interface Memory {
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
}

interface MemoryStackType {
  title: string;
  description: string;
  itemCount: number;
  lastUpdated: string;
  color: string;
}

export default function MemoryStackPage() {
  const router = useRouter();
  const [memoryStacks, setMemoryStacks] = useState<MemoryStackType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStack, setActiveStack] = useState<string | null>(null);
  const [stackMemories, setStackMemories] = useState<Record<string, Memory[]>>({});
  const [expandedMemoryActions, setExpandedMemoryActions] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchMemoryStacks();
  }, []);

  const fetchMemoryStacks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/memory-stack'); // Changed from 'memory-stacks' to 'memory-stack'
      
      if (!response.ok) {
        throw new Error("Failed to fetch memory stacks");
      }
      
      const data = await response.json();
      setMemoryStacks(data.stacks || []);
    } catch (error: any) {
      console.error("Error fetching memory stacks:", error);
      setError(error.message || "Failed to load memory stacks");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStackMemories = async (category: string) => {
    try {
      // Skip if we already loaded this category
      if (stackMemories[category]) return;
      
      const response = await fetch('/api/memories/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category })
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch memories");
      }
      
      const data = await response.json();
      
      // Update the stack memories state
      setStackMemories(prev => ({
        ...prev,
        [category]: data.results || []
      }));
    } catch (error: any) {
      console.error(`Error fetching memories for ${category}:`, error);
    }
  };

  const handleStackClick = (stack: MemoryStackType) => {
    // Toggle active stack
    if (activeStack === stack.title) {
      setActiveStack(null);
    } else {
      setActiveStack(stack.title);
      // Fetch memories for this stack if needed
      fetchStackMemories(stack.title);
    }
  };

  const handleNewMemory = () => {
    router.push('/new-memory');
  };
  
  const handleMemoryClick = (memory: Memory) => {
    router.push(`/memory/${memory.id}`);
  };

  const toggleMemoryActions = (memoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (expandedMemoryActions === memoryId) {
      setExpandedMemoryActions(null);
    } else {
      setExpandedMemoryActions(memoryId);
    }
  };

  const handleEditMemory = (memoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/memory/${memoryId}`);
  };
  
  const handleDeleteMemory = async (memory: Memory, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${memory.title}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      setIsDeleting(memory.id);
      
      const response = await fetch(`/api/memories/${memory.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete memory");
      }
      
      // Remove the memory from the stack
      setStackMemories(prev => {
        const updatedStacks = { ...prev };
        if (updatedStacks[memory.category]) {
          updatedStacks[memory.category] = updatedStacks[memory.category].filter(m => m.id !== memory.id);
        }
        return updatedStacks;
      });
      
      // Refresh the stacks to update the counts
      fetchMemoryStacks();
      
      alert("Memory deleted successfully");
    } catch (error: any) {
      console.error("Error deleting memory:", error);
      alert(error.message || "Failed to delete memory");
    } finally {
      setIsDeleting(null);
      setExpandedMemoryActions(null);
    }
  };

  return (
    <Layout currentPage="Memory Stack">
      <div className="space-y-6">
        <div className="flex items-center">
          <Database className="text-purple-400 mr-2" size={22} />
          <h1 className="text-2xl font-bold">Memory Stack</h1>
        </div>
        
        <p className="text-gray-300">Access and manage your structured memory collections.</p>
        
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              // Loading skeletons
              Array(6).fill(0).map((_, index) => (
                <Card key={index} className="bg-slate-800/50 border-slate-700 overflow-hidden relative animate-pulse">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-600"></div>
                  <CardContent className="p-4 pt-5">
                    <div className="h-6 bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-700 rounded w-full mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-slate-700 rounded w-1/4"></div>
                      <div className="h-3 bg-slate-700 rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : error ? (
              <div className="col-span-3 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                {error}
              </div>
            ) : memoryStacks.length > 0 ? (
              memoryStacks.map((stack, index) => (
                <div key={index} className="flex flex-col space-y-3">
                  <Card 
                    className={`bg-slate-800/50 border-slate-700 overflow-hidden relative group hover:shadow-lg transition-all cursor-pointer ${activeStack === stack.title ? 'border-purple-500/30' : ''}`}
                    onClick={() => handleStackClick(stack)}
                  >
                    <div className={`absolute top-0 left-0 w-full h-1`} style={{ backgroundColor: getColorValue(stack.color) }}></div>
                    <CardContent className="p-4 pt-5">
                      <h3 className="font-bold text-white">{stack.title}</h3>
                      <p className="text-sm text-gray-300 mt-1 mb-4">{stack.description}</p>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{stack.itemCount} items</span>
                        <span>Updated {stack.lastUpdated}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Expanded memories for this stack */}
                  {activeStack === stack.title && (
                    <div className="pl-4 border-l-2 border-slate-700 ml-4 space-y-2">
                      {!stackMemories[stack.title] ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                        </div>
                      ) : stackMemories[stack.title].length === 0 ? (
                        <div className="text-center py-4 px-2 text-gray-400 bg-slate-800/30 rounded-lg">
                          <p>No memories in this category</p>
                          <button
                            onClick={handleNewMemory}
                            className="mt-2 text-purple-400 hover:text-purple-300 text-sm"
                          >
                            + Add a memory
                          </button>
                        </div>
                      ) : (
                        stackMemories[stack.title].map((memory) => (
                          <Card 
                            key={memory.id}
                            className="bg-slate-800/30 border-slate-700 hover:border-purple-500/20 transition-colors cursor-pointer"
                            onClick={() => handleMemoryClick(memory)}
                          >
                            <CardContent className="p-3 relative">
                              <div className="mb-1 flex justify-between items-start">
                                <h4 className="font-medium text-white">{memory.title}</h4>
                                <div className="relative">
                                  <button
                                    onClick={(e) => toggleMemoryActions(memory.id, e)}
                                    className="p-1 text-gray-400 hover:text-white rounded-full"
                                  >
                                    <MoreHorizontal size={16} />
                                  </button>
                                  
                                  {expandedMemoryActions === memory.id && (
                                    <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-10">
                                      <button
                                        onClick={(e) => handleEditMemory(memory.id, e)}
                                        className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-slate-700"
                                      >
                                        <Edit size={14} className="mr-2" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={(e) => handleDeleteMemory(memory, e)}
                                        className="flex items-center w-full px-3 py-2 text-sm text-left text-red-400 hover:bg-red-500/10"
                                        disabled={isDeleting === memory.id}
                                      >
                                        {isDeleting === memory.id ? (
                                          <Loader2 size={14} className="mr-2 animate-spin" />
                                        ) : (
                                          <Trash2 size={14} className="mr-2" />
                                        )}
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-400 line-clamp-2">
                                {memory.summary || memory.content.substring(0, 100) + (memory.content.length > 100 ? '...' : '')}
                              </p>
                              
                              {memory.tags && memory.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {memory.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <span key={tagIndex} className="px-1.5 py-0.5 bg-slate-700 text-xs text-gray-300 rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                  {memory.tags.length > 3 && (
                                    <span className="px-1.5 py-0.5 bg-slate-700 text-xs text-gray-400 rounded-full">
                                      +{memory.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-gray-400">
                <Database size={40} className="mx-auto mb-4 text-gray-500 opacity-50" />
                <h3 className="text-xl font-medium mb-2">No memory stacks yet</h3>
                <p className="mb-4">Start building your memory stack by adding your first memory</p>
                <button
                  onClick={handleNewMemory}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                >
                  <Plus size={16} className="inline-block mr-2" />
                  Add Your First Memory
                </button>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Floating action button for adding new memory */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={handleNewMemory}
            className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:shadow-purple-500/20 transition-all"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </Layout>
  );
}

// Helper function to get CSS color value
function getColorValue(color: string): string {
  const colorMap: Record<string, string> = {
    'purple': '#8b5cf6',
    'blue': '#3b82f6',
    'emerald': '#10b981',
    'amber': '#f59e0b',
    'pink': '#ec4899',
    'indigo': '#6366f1'
  };
  
  return colorMap[color] || '#8b5cf6';
}