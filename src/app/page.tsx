// src/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight,
  Loader2,
  TrendingUp,
  BookOpen,
  Brain,
  Zap,
  Tag,
  BarChart3,
  Activity,
  Archive,
} from "lucide-react";
import Layout from "@/components/layout";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { MemoryCard } from "@/components/shared/MemoryCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Memory } from "@/lib/memory-utils";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Stats interface
interface Stats {
  totalMemories: number;
  totalCategories: number;
  recentActivity: number;
  popularTags: { tag: string; count: number }[];
}

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
        <div className="flex-shrink-0 space-y-6 p-6 pb-0">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold brand-terracotta">
                Welcome back!
              </h1>
              <p className="text-muted-foreground mt-2">
                Here's what's happening with your memories
              </p>
            </div>
            <div className="flex gap-3"></div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border card-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Memories
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.totalMemories}
                    </p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Archive size={20} className="text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border card-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.totalCategories}
                    </p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 size={20} className="text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border card-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.recentActivity}
                    </p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity size={20} className="text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border card-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Popular Tags
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.popularTags.length}
                    </p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Tag size={20} className="text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-6 h-full p-6 pt-4">
            {/* Recent Memories */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <BookOpen size={20} className="text-primary" />
                  Recent Memories
                </h2>
                <button
                  onClick={viewAllMemories}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
                >
                  View all <ArrowRight size={14} />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="pr-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center space-y-4">
                          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                          <p className="text-muted-foreground">
                            Loading your memories...
                          </p>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
                        {error}
                      </div>
                    ) : memories.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
                        {memories.map((memory) => (
                          <MemoryCard
                            key={memory.id}
                            memory={memory}
                            onClick={navigateToMemory}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={<Archive />}
                        title="No memories found"
                        description="Start building your knowledge base"
                        action={{
                          label: "Add Your First Memory",
                          onClick: createNewMemory,
                        }}
                      />
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Sidebar with Popular Tags and Insights */}
            <div className="w-full lg:w-80 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-6 pr-4">
                    {/* Popular Tags */}
                    <Card className="bg-card border-border card-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold flex items-center gap-2 text-foreground">
                            <Tag size={16} className="text-primary" />
                            Popular Tags
                          </h3>
                        </div>

                        {stats.popularTags.length > 0 ? (
                          <div className="space-y-2">
                            {stats.popularTags.map((tagData, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-muted rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                  <span className="text-sm text-foreground">
                                    {tagData.tag}
                                  </span>
                                </div>
                                <span className="text-xs text-secondary-foreground bg-secondary px-2 py-0.5 rounded-full">
                                  {tagData.count}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No tags yet
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Memory Insights */}
                    <Card className="bg-card border-border card-shadow">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                          <TrendingUp size={16} className="brand-sage" />
                          Insights
                        </h3>

                        <div className="space-y-3">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">
                              Most Active Category
                            </p>
                            <p className="text-sm text-foreground font-medium">
                              {stats.popularTags[0]?.tag || "No data yet"}
                            </p>
                          </div>

                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">
                              Weekly Growth
                            </p>
                            <div className="flex items-center gap-2">
                              <TrendingUp size={14} className="brand-sage" />
                              <p className="text-sm brand-sage font-medium">
                                +{stats.recentActivity} this week
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Navigation Card */}
                    <Card className="bg-card border-border card-shadow">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                          <Zap size={16} className="brand-coral" />
                          Explore More
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => router.push("/library")}
                            className="flex flex-col items-center gap-2 p-3 bg-muted rounded-lg hover:bg-secondary/20 hover:text-foreground transition-all cursor-pointer group"
                          >
                            <BookOpen
                              size={20}
                              className="text-muted-foreground group-hover:text-foreground"
                            />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground">
                              Library
                            </span>
                          </button>

                          <button
                            onClick={openAIAgents}
                            className="flex flex-col items-center gap-2 p-3 bg-muted rounded-lg hover:bg-secondary/20 hover:text-foreground transition-all cursor-pointer group"
                          >
                            <Brain
                              size={20}
                              className="text-muted-foreground group-hover:text-foreground"
                            />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground">
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
