"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// If you don't have tabs component, remove these imports
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Brain, Calendar, Tag, Activity, Clock, BookOpen } from "lucide-react";

// Add recharts to your dependencies if not already installed
// npm install recharts
// If you can't install recharts, we'll implement an alternative visualization

interface MemoryStats {
  total_memories: number;
  total_categories: number;
  newest_memory: string;
  oldest_memory: string;
  memories_last_week: number;
  memories_last_month: number;
  by_category: {
    category: string;
    count: number;
    color: string;
  }[];
  by_type: {
    type: string;
    count: number;
    color: string;
  }[];
  by_time: {
    date: string;
    count: number;
  }[];
  popular_tags: {
    tag: string;
    count: number;
  }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("month"); // week, month, year, all

  useEffect(() => {
    fetchMemoryStats();
  }, [timeRange]);

  const fetchMemoryStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analytics/memories?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error("Failed to fetch memory statistics");
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      console.error("Error fetching memory stats:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout currentPage="Dashboard">
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout currentPage="Dashboard">
        <div className="text-center py-20 text-gray-400">
          <p className="text-xl font-medium text-red-400 mb-2">Error</p>
          <p>{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Memory Dashboard</h1>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-md p-1">
            <button
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'week' ? 'bg-slate-700 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setTimeRange('week')}
            >
              Week
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'month' ? 'bg-slate-700 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setTimeRange('month')}
            >
              Month
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'year' ? 'bg-slate-700 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setTimeRange('year')}
            >
              Year
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'all' ? 'bg-slate-700 text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setTimeRange('all')}
            >
              All
            </button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Memories</p>
                <p className="text-3xl font-bold text-white">{stats?.total_memories || 0}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-full">
                <Brain className="h-6 w-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Categories</p>
                <p className="text-3xl font-bold text-white">{stats?.total_categories || 0}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <BookOpen className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Last 7 Days</p>
                <p className="text-3xl font-bold text-white">{stats?.memories_last_week || 0}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-full">
                <Activity className="h-6 w-6 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Last 30 Days</p>
                <p className="text-3xl font-bold text-white">{stats?.memories_last_month || 0}</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-full">
                <Calendar className="h-6 w-6 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts (simplified without recharts dependency) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Memory Activity Chart */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Memory Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] flex items-end justify-between">
                {stats?.by_time.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-8 bg-gradient-to-t from-purple-600 to-blue-500 rounded-t"
                      style={{ 
                        height: `${Math.max(20, (item.count / Math.max(...stats.by_time.map(d => d.count))) * 200)}px`
                      }}
                    ></div>
                    <span className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-top-left">
                      {item.date}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Distribution by Category */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Distribution by Category</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {stats?.by_category.map((category, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{category.category}</span>
                      <span className="text-gray-400">{category.count} ({
                        Math.round((category.count / (stats?.total_memories || 1)) * 100)
                      }%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${(category.count / (stats?.total_memories || 1)) * 100}%`,
                          backgroundColor: category.color
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Memory Types Chart */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Memory Types</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {stats?.by_type.map((type, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{type.type}</span>
                      <span className="text-gray-400">{type.count}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${(type.count / (stats?.total_memories || 1)) * 100}%`,
                          backgroundColor: type.color
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Popular Tags */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Popular Tags</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {stats?.popular_tags.map((tag, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{tag.tag}</span>
                      <span className="text-gray-400">{tag.count}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ 
                          width: `${(tag.count / (stats?.popular_tags[0]?.count || 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}