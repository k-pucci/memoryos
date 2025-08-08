"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight,
  Clock,
  Loader2,
  TrendingUp,
  BookOpen,
  Brain,
  Zap,
  Plus,
  Tag,
  Calendar,
  BarChart3,
  Activity,
  Star,
  Archive,
} from "lucide-react";
import Layout from "@/components/layout";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Memory Card Component
interface MemoryCardProps {
  id: string;
  title: string;
  category: string;
  content?: string;
  items?: string[];
  gradient: string;
  icon: string;
  createdAt: string;
  onClick: (id: string) => void;
}

// Memory data type
interface Memory {
  id: string;
  title: string;
  category: string;
  memory_type: string;
  content: string;
  summary: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Stats interface
interface Stats {
  totalMemories: number;
  totalCategories: number;
  recentActivity: number;
  popularTags: { tag: string; count: number }[];
}

// Helper to get proper icon for each category
const getCategoryIcon = (category: string): string => {
  const categoryIcons: Record<string, string> = {
    Research: "🔬",
    Product: "💡",
    "User Experience": "🎨",
    Strategy: "🎯",
    Meeting: "👥",
    Task: "✅",
    Learning: "📚",
    Idea: "💭",
    Personal: "👤",
    Work: "💼",
    Project: "🚀",
  };

  return categoryIcons[category] || "📋";
};

// Helper to get proper gradient for each category
const getCategoryGradient = (category: string): string => {
  const categoryGradients: Record<string, string> = {
    Research: "from-purple-500/20 to-indigo-500/20",
    Product: "from-blue-500/20 to-cyan-500/20",
    "User Experience": "from-emerald-500/20 to-green-500/20",
    Strategy: "from-amber-500/20 to-orange-500/20",
    Meeting: "from-blue-500/20 to-indigo-500/20",
    Task: "from-gray-500/20 to-slate-500/20",
    Learning: "from-teal-500/20 to-emerald-500/20",
    Idea: "from-pink-500/20 to-rose-500/20",
    Personal: "from-violet-500/20 to-purple-500/20",
    Work: "from-slate-500/20 to-gray-500/20",
    Project: "from-orange-500/20 to-red-500/20",
  };

  return categoryGradients[category] || "from-gray-500/20 to-slate-500/20";
};

export default function HomePage() {
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalMemories: 0,
    totalCategories: 0,
    recentActivity: 0,
    popularTags: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch memories and stats from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        // Fetch recent memories
        const { data: memoriesData, error: memoriesError } = await supabase
          .from("memories")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6);

        if (memoriesError) throw memoriesError;

        // Fetch stats
        const { data: allMemories, error: statsError } = await supabase
          .from("memories")
          .select("category, tags, created_at");

        if (statsError) throw statsError;

        // Calculate stats
        const categories = new Set(allMemories?.map((m) => m.category) || []);
        const recentWeek =
          allMemories?.filter((m) => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(m.created_at) > weekAgo;
          }) || [];

        // Calculate popular tags
        const tagCounts: Record<string, number> = {};
        allMemories?.forEach((memory) => {
          if (memory.tags && Array.isArray(memory.tags)) {
            memory.tags.forEach((tag) => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });

        const popularTags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([tag, count]) => ({ tag, count }));

        setMemories(memoriesData || []);
        setStats({
          totalMemories: allMemories?.length || 0,
          totalCategories: categories.size,
          recentActivity: recentWeek.length,
          popularTags,
        });
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Process memory content
  const processMemoryContent = (
    memory: Memory
  ): { content: string; items: string[] } => {
    const lines = memory.content.split("\n");
    const bulletPattern = /^[-*•]\s+(.+)$/;

    const items: string[] = [];
    let regularContent = "";

    lines.forEach((line) => {
      const match = line.match(bulletPattern);
      if (match && match[1]) {
        items.push(match[1].trim());
      } else if (line.trim()) {
        regularContent += line + " ";
      }
    });

    return {
      content: regularContent.trim() || memory.summary,
      items: items,
    };
  };

  // Navigation functions
  const navigateToMemory = (id: string) => {
    router.push(`/memory/${id}`);
  };

  const viewAllMemories = () => {
    router.push("/library");
  };

  const createNewMemory = () => {
    router.push("/new-memory");
  };

  const openAIAgents = () => {
    router.push("/agents/create");
  };

  return (
    <Layout currentPage="Home">
      <div className="flex flex-col h-full max-h-screen overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 space-y-4 p-4 md:p-6 pb-0">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Welcome back!
              </h1>
              <p className="text-gray-400 mt-1 text-sm md:text-base">
                Here's what's happening with your memories
              </p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={openAIAgents}
                className="flex items-center gap-2 px-3 py-2 md:px-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg hover:shadow-lg hover:shadow-purple-500/20 hover:from-purple-500/30 hover:to-blue-500/30 hover:border-purple-500/50 transition-all text-white cursor-pointer text-sm"
              >
                <Brain size={16} className="md:w-[18px] md:h-[18px]" />
                <span className="hidden sm:inline">AI Agents</span>
                <span className="sm:hidden">AI</span>
              </button>
              <button
                onClick={createNewMemory}
                className="flex items-center gap-2 px-3 py-2 md:px-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white hover:shadow-lg hover:shadow-purple-500/20 hover:from-purple-600 hover:to-blue-600 transition-all cursor-pointer text-sm"
              >
                <Plus size={16} className="md:w-[18px] md:h-[18px]" />
                <span className="hidden sm:inline">New Memory</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-400">
                      Total Memories
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-white">
                      {stats.totalMemories}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Archive
                      size={16}
                      className="text-purple-400 md:w-5 md:h-5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-400">
                      Categories
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-white">
                      {stats.totalCategories}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <BarChart3
                      size={16}
                      className="text-blue-400 md:w-5 md:h-5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-400">
                      This Week
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-white">
                      {stats.recentActivity}
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Activity
                      size={16}
                      className="text-emerald-400 md:w-5 md:h-5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-400">
                      Popular Tags
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-white">
                      {stats.popularTags.length}
                    </p>
                  </div>
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Tag size={16} className="text-amber-400 md:w-5 md:h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-full p-4 md:p-6 pt-4">
            {/* Recent Memories */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                  <BookOpen
                    size={18}
                    className="text-purple-400 md:w-5 md:h-5"
                  />
                  Recent Memories
                </h2>
                <button
                  onClick={viewAllMemories}
                  className="text-sm text-gray-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  View all <ArrowRight size={14} />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="pr-2 md:pr-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                      </div>
                    ) : error ? (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
                        {error}
                      </div>
                    ) : memories.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 pb-4">
                        {memories.map((memory) => {
                          const { content, items } =
                            processMemoryContent(memory);
                          return (
                            <MemoryCard
                              key={memory.id}
                              id={memory.id}
                              title={memory.title}
                              category={memory.category}
                              content={content}
                              items={items}
                              gradient={getCategoryGradient(memory.category)}
                              icon={getCategoryIcon(memory.category)}
                              createdAt={memory.created_at}
                              onClick={navigateToMemory}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-4">
                        <Archive
                          size={40}
                          className="text-gray-500 mb-4 md:w-12 md:h-12"
                        />
                        <p className="mb-2 text-center">No memories found</p>
                        <p className="text-sm text-gray-500 mb-6 text-center">
                          Start building your knowledge base
                        </p>
                        <button
                          onClick={createNewMemory}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white hover:shadow-lg hover:shadow-purple-500/20 hover:from-purple-600 hover:to-blue-600 transition-all cursor-pointer text-sm"
                        >
                          Add Your First Memory
                        </button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Sidebar with Popular Tags and Insights */}
            <div className="w-full lg:w-80 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-4 md:space-y-6 pr-2">
                    {/* Popular Tags */}
                    <Card className="bg-gradient-to-br from-slate-800/70 to-slate-800/30 border-slate-700">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold flex items-center gap-2 text-sm md:text-base">
                            <Tag
                              size={14}
                              className="text-purple-400 md:w-4 md:h-4"
                            />
                            Popular Tags
                          </h3>
                          <button
                            onClick={() => router.push("/library")}
                            className="text-xs text-gray-400 hover:text-purple-300 transition-colors cursor-pointer"
                          >
                            View all
                          </button>
                        </div>

                        {stats.popularTags.length > 0 ? (
                          <div className="space-y-2">
                            {stats.popularTags.map((tagData, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg hover:bg-slate-800/70 hover:border hover:border-purple-500/30 transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                  <span className="text-xs md:text-sm text-gray-300 hover:text-white transition-colors">
                                    {tagData.tag}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400 bg-slate-800 px-2 py-0.5 rounded-full">
                                  {tagData.count}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs md:text-sm text-gray-400">
                            No tags yet
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Memory Insights */}
                    <Card className="bg-gradient-to-br from-slate-800/70 to-slate-800/30 border-slate-700">
                      <CardContent className="p-3 md:p-4">
                        <h3 className="font-bold mb-3 flex items-center gap-2 text-sm md:text-base">
                          <TrendingUp
                            size={14}
                            className="text-emerald-400 md:w-4 md:h-4"
                          />
                          Insights
                        </h3>

                        <div className="space-y-3">
                          <div className="p-3 bg-slate-900/50 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">
                              Most Active Category
                            </p>
                            <p className="text-xs md:text-sm text-gray-300">
                              {stats.popularTags[0]?.tag || "No data yet"}
                            </p>
                          </div>

                          <div className="p-3 bg-slate-900/50 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">
                              Weekly Growth
                            </p>
                            <div className="flex items-center gap-2">
                              <TrendingUp
                                size={12}
                                className="text-emerald-400 md:w-[14px] md:h-[14px]"
                              />
                              <p className="text-xs md:text-sm text-emerald-300">
                                +{stats.recentActivity} this week
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Navigation Card */}
                    <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
                      <CardContent className="p-3 md:p-4">
                        <h3 className="font-bold mb-3 flex items-center gap-2 text-sm md:text-base">
                          <Zap
                            size={14}
                            className="text-blue-400 md:w-4 md:h-4"
                          />
                          Explore More
                        </h3>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => router.push("/library")}
                            className="flex flex-col items-center gap-2 p-3 bg-slate-900/30 rounded-lg hover:bg-slate-800/50 hover:border hover:border-emerald-500/30 transition-all text-gray-300 hover:text-white cursor-pointer"
                          >
                            <BookOpen size={18} className="md:w-5 md:h-5" />
                            <span className="text-xs text-center">Library</span>
                          </button>

                          <button
                            onClick={openAIAgents}
                            className="flex flex-col items-center gap-2 p-3 bg-slate-900/30 rounded-lg hover:bg-slate-800/50 hover:border hover:border-blue-500/30 transition-all text-gray-300 hover:text-white cursor-pointer"
                          >
                            <Brain size={18} className="md:w-5 md:h-5" />
                            <span className="text-xs text-center">
                              AI Agents
                            </span>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function MemoryCard({
  id,
  title,
  category,
  content = "",
  items = [],
  gradient,
  icon,
  createdAt,
  onClick,
}: MemoryCardProps) {
  return (
    <Card
      className={`bg-gradient-to-br ${gradient} border-none overflow-hidden relative group hover:shadow-lg hover:scale-[1.02] hover:shadow-purple-500/10 transition-all cursor-pointer h-fit`}
      onClick={() => onClick(id)}
    >
      <div className="absolute inset-0 bg-slate-900/80 group-hover:bg-slate-900/70 transition-all"></div>
      <CardContent className="p-3 md:p-4 relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm md:text-lg">{icon}</span>
            <span className="text-xs px-2 py-1 bg-white/10 group-hover:bg-white/20 rounded-full text-gray-300 group-hover:text-white border border-white/20 group-hover:border-white/30 transition-all">
              {category}
            </span>
          </div>
          <div className="flex items-center text-xs text-gray-400 gap-1">
            <Clock size={10} className="md:w-3 md:h-3" />
            <span className="hidden sm:inline">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
            <span className="sm:hidden">
              {formatDistanceToNow(new Date(createdAt), {
                addSuffix: true,
              }).replace(" ago", "")}
            </span>
          </div>
        </div>

        <h2 className="font-bold text-white group-hover:text-purple-100 mb-2 line-clamp-2 transition-colors text-sm md:text-base">
          {title}
        </h2>

        {content && (
          <p className="text-xs md:text-sm text-gray-300 group-hover:text-gray-200 line-clamp-3 mb-2 transition-colors">
            {content}
          </p>
        )}

        {items && items.length > 0 && (
          <ul className="list-disc list-inside text-xs md:text-sm text-gray-300 group-hover:text-gray-200 ml-1 space-y-1 transition-colors">
            {items.slice(0, 2).map((item: string, index: number) => (
              <li key={index} className="line-clamp-1">
                {item}
              </li>
            ))}
            {items.length > 2 && (
              <li className="text-gray-400 group-hover:text-gray-300">
                +{items.length - 2} more items
              </li>
            )}
          </ul>
        )}

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={14} className="text-white/80 md:w-4 md:h-4" />
        </div>
      </CardContent>
    </Card>
  );
}
