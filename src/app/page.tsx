// src/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MemoryCard } from "@/components/shared/MemoryCard";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  DashboardLayout,
  Stack,
  Grid,
  Section,
  SidebarLayout,
} from "@/components/layout/index";
import { Memory } from "@/lib/memory-utils";

// Stats interface
interface Stats {
  totalMemories: number;
  totalCategories: number;
  recentActivity: number;
  popularTags: { tag: string; count: number }[];
}

// Extract StatsCard component for reusability
function StatsCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <Card className="bg-card border-border card-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon size={20} className="text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Extract PopularTags component
function PopularTagsCard({ tags }: { tags: { tag: string; count: number }[] }) {
  return (
    <Card className="bg-card border-border card-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2 text-foreground">
            <Tag size={16} className="text-primary" />
            Popular Tags
          </h3>
        </div>

        {tags.length > 0 ? (
          <Stack space="2">
            {tags.map((tagData, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-foreground">{tagData.tag}</span>
                </div>
                <span className="text-xs text-secondary-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {tagData.count}
                </span>
              </div>
            ))}
          </Stack>
        ) : (
          <p className="text-sm text-muted-foreground">No tags yet</p>
        )}
      </CardContent>
    </Card>
  );
}

// Extract InsightsCard component
function InsightsCard({ stats }: { stats: Stats }) {
  return (
    <Card className="bg-card border-border card-shadow">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
          <TrendingUp size={16} className="brand-sage" />
          Insights
        </h3>

        <Stack space="3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">
              Most Active Category
            </p>
            <p className="text-sm text-foreground font-medium">
              {stats.popularTags[0]?.tag || "No data yet"}
            </p>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Weekly Growth</p>
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="brand-sage" />
              <p className="text-sm brand-sage font-medium">
                +{stats.recentActivity} this week
              </p>
            </div>
          </div>
        </Stack>
      </CardContent>
    </Card>
  );
}

// Extract ExploreCard component
function ExploreCard({ router }: { router: any }) {
  return (
    <Card className="bg-card border-border card-shadow">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
          <Zap size={16} className="brand-coral" />
          Explore More
        </h3>

        <Grid cols="2" gap="3">
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
            onClick={() => router.push("/new-memory")}
            className="flex flex-col items-center gap-2 p-3 bg-muted rounded-lg hover:bg-secondary/20 hover:text-foreground transition-all cursor-pointer group"
          >
            <Brain
              size={20}
              className="text-muted-foreground group-hover:text-foreground"
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground">
              New Memory
            </span>
          </button>
        </Grid>
      </CardContent>
    </Card>
  );
}

// Main component
export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalMemories: 0,
    totalCategories: 0,
    recentActivity: 0,
    popularTags: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // Fetch memories and stats from Supabase
  useEffect(() => {
    // Early return if no user or still loading auth
    if (!user || authLoading) return;

    async function fetchData() {
      // Additional null check inside fetchData for TypeScript
      if (!user) return;
      
      const supabase = createClient();
      
      try {
        setIsLoading(true);

        // Fetch recent memories for this user
        const { data: memoriesData, error: memoriesError } = await supabase
          .from("memories")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(4);

        if (memoriesError) throw memoriesError;

        // Fetch stats for this user
        const { data: allMemories, error: statsError } = await supabase
          .from("memories")
          .select("category, tags, created_at")
          .eq("user_id", user.id);

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
  }, [user, authLoading]); // Added authLoading to dependencies

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // Navigation functions
  const navigateToMemory = (id: string) => router.push(`/memory/${id}`);
  const viewAllMemories = () => router.push("/library");
  const createNewMemory = () => router.push("/new-memory");

  // Sidebar content
  const sidebar = (
    <Stack space="6">
      <PopularTagsCard tags={stats.popularTags} />
      <InsightsCard stats={stats} />
      <ExploreCard router={router} />
    </Stack>
  );

  return (
    <DashboardLayout
      currentPage="Home"
      title="Welcome back!"
      description="Here's what's happening with your memories"
    >
      <div className="px-6 pb-6">
        <Stack space="6">
          {/* Stats Cards */}
          <Grid cols="2" responsive={{ md: 4 }} gap="4">
            <StatsCard
              title="Total Memories"
              value={stats.totalMemories}
              icon={Archive}
            />
            <StatsCard
              title="Categories"
              value={stats.totalCategories}
              icon={BarChart3}
            />
            <StatsCard
              title="This Week"
              value={stats.recentActivity}
              icon={Activity}
            />
            <StatsCard
              title="Popular Tags"
              value={stats.popularTags.length}
              icon={Tag}
            />
          </Grid>

          {/* Main Content with Sidebar */}
          <SidebarLayout sidebar={sidebar} mainCols={2} sidebarCols={1}>
            <Section
              title="Recent Memories"
              actions={
                <button
                  onClick={viewAllMemories}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
                >
                  View all <ArrowRight size={14} />
                </button>
              }
            >
              {/* Memories Content */}
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
                <Grid cols="1" responsive={{ xl: 2 }} gap="4">
                  {memories.map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      onClick={navigateToMemory}
                    />
                  ))}
                </Grid>
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
            </Section>
          </SidebarLayout>
        </Stack>
      </div>
    </DashboardLayout>
  );
}