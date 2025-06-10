"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen, Search, Clock, ArrowUpRight } from "lucide-react";
import Layout from "@/components/layout";

export default function LibraryPage() {
  return (
    <Layout currentPage="Library">
      <div className="space-y-6">
        <div className="flex items-center">
          <BookOpen className="text-purple-400 mr-2" size={22} />
          <h1 className="text-2xl font-bold">Library</h1>
        </div>
        
        <p className="text-gray-300">Access your collected knowledge and resources.</p>
        
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <Input
            placeholder="Search your library..."
            className="bg-slate-800/50 border-slate-700 text-white pl-10 h-12 rounded-xl focus:border-purple-500 focus:ring focus:ring-purple-500/20 transition-all"
          />
        </div>
        
        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <button
              key={index}
                                    className={`px-3 py-1.5 rounded-full text-sm ${index === 0 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800/50 text-gray-300 border border-slate-700 hover:bg-slate-700/50 transition-all'} cursor-pointer`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Library Items */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Recently Added</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentItems.map((item, index) => (
                  <LibraryCard key={index} {...item} />
                ))}
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold mb-4">Favorites</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteItems.map((item, index) => (
                  <LibraryCard key={index} {...item} />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
}

// Library Card Component
function LibraryCard({ title, type, source, added, author, color }: LibraryItemType) {
  return (
    <Card className={`bg-slate-800/50 border-slate-700 overflow-hidden relative group hover:shadow-lg transition-all cursor-pointer`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-${color}-500`}></div>
      <CardContent className="p-4 pt-5">
        <div className="flex justify-between items-start mb-2">
          <span className={`px-2 py-0.5 rounded-full text-xs bg-${color}-500/20 text-${color}-300`}>
            {type}
          </span>
          <button className="text-gray-400 hover:text-white transition-colors">
            <ArrowUpRight size={16} />
          </button>
        </div>
        
        <h3 className="font-bold text-white mb-2">{title}</h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {author && (
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback className={`bg-${color}-500/20 text-${color}-300 text-xs`}>
                  {author.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="text-xs text-gray-400 truncate">
              {source}
            </span>
          </div>
          
          <div className="flex items-center text-xs text-gray-400">
            <Clock size={12} className="mr-1" />
            <span>{added}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Types
interface LibraryItemType {
  title: string;
  type: string;
  source: string;
  added: string;
  author?: string;
  color: string;
}

// Sample data
const categories = [
  "All", "Articles", "Books", "Notes", "Research Papers", "Videos", "Podcasts", "Code Snippets"
];

const recentItems: LibraryItemType[] = [
  {
    title: "Advanced State Management in React",
    type: "Article",
    source: "dev.to",
    added: "Today",
    author: "Sarah Johnson",
    color: "blue"
  },
  {
    title: "The Future of AI in Personal Knowledge Management",
    type: "Research Paper",
    source: "arxiv.org",
    added: "Yesterday",
    author: "Dr. Michael Chen",
    color: "purple"
  },
  {
    title: "Building Scalable Design Systems",
    type: "Video",
    source: "YouTube",
    added: "2 days ago",
    color: "emerald"
  }
];

const favoriteItems: LibraryItemType[] = [
  {
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    type: "Book",
    source: "Personal Library",
    added: "1 month ago",
    author: "Robert C. Martin",
    color: "amber"
  },
  {
    title: "The Psychology of Personal Information Management",
    type: "Article",
    source: "Medium",
    added: "2 weeks ago",
    author: "Lisa Wang",
    color: "pink"
  },
  {
    title: "User-Centered Design Principles",
    type: "Notes",
    source: "UX Workshop",
    added: "3 months ago",
    color: "indigo"
  }
];