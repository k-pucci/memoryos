"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Avatar, 
  AvatarFallback 
} from "@/components/ui/avatar";
import { 
  ArrowRight,
  Calendar,
  Clock,
  Loader2
} from "lucide-react";
import Layout from "@/components/layout";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Memory Card Component with proper TypeScript typing
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

// Meeting Card Component
interface MeetingCardProps {
  id: string;
  title: string;
  time: string;
  duration: number;
  description: string;
  items?: string[];
  attendees: {initials: string, color: string}[];
  gradient: string;
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

// Helper to get proper icon for each category
const getCategoryIcon = (category: string): string => {
  const categoryIcons: Record<string, string> = {
    "Research": "🤖",
    "Product": "💡",
    "User Experience": "🚀",
    "Strategy": "🗺️",
    "Meeting": "📅",
    "Task": "✅",
    "Learning": "📚",
    "Idea": "💭"
  };
  
  return categoryIcons[category] || "📋"; // Default icon
};

// Helper to get proper gradient for each category
const getCategoryGradient = (category: string): string => {
  const categoryGradients: Record<string, string> = {
    "Research": "from-purple-500/20 to-indigo-500/20",
    "Product": "from-blue-500/20 to-cyan-500/20",
    "User Experience": "from-emerald-500/20 to-green-500/20",
    "Strategy": "from-amber-500/20 to-orange-500/20",
    "Meeting": "from-blue-500/20 to-indigo-500/20",
    "Task": "from-gray-500/20 to-slate-500/20",
    "Learning": "from-teal-500/20 to-emerald-500/20",
    "Idea": "from-pink-500/20 to-rose-500/20"
  };
  
  return categoryGradients[category] || "from-gray-500/20 to-slate-500/20"; // Default gradient
};

// Sample meeting data - Replace this with actual data in a future update
const upcomingMeetings = [
  {
    id: "meet-001",
    title: "Client Check-in",
    time: "Today, 2:00 PM",
    duration: 30,
    description: "Client had questions about the onboarding process; suggested more examples.",
    gradient: "from-blue-500/10 to-purple-500/10",
    attendees: [
      { initials: "JD", color: "blue" },
      { initials: "AR", color: "purple" }
    ]
  },
  {
    id: "meet-002",
    title: "Q1 Planning",
    time: "Tomorrow, 10:00 AM",
    duration: 60,
    description: "Main concerns:",
    items: ["Resource allocation", "Product roadmap alignment", "Customer feedback trends"],
    gradient: "from-purple-500/10 to-pink-500/10",
    attendees: [
      { initials: "TK", color: "pink" },
      { initials: "LM", color: "indigo" },
      { initials: "JS", color: "emerald" },
      { initials: "BP", color: "amber" },
      { initials: "AN", color: "blue" }
    ]
  }
];

export default function HomePage() {
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Fetch memories from Supabase
  useEffect(() => {
    async function fetchRecentMemories() {
      try {
        setIsLoading(true);
        
        // Fetch the most recent memories
        const { data, error } = await supabase
          .from('memories')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);
        
        if (error) {
          throw error;
        }
        
        setMemories(data || []);
      } catch (err: any) {
        console.error('Error fetching memories:', err);
        setError(err.message || 'Failed to load memories');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchRecentMemories();
  }, []);
  
  // Process memory content to extract bullet points if needed
  const processMemoryContent = (memory: Memory): { content: string, items: string[] } => {
    // Simple heuristic: Check if content has bullet points (lines starting with - or *)
    const lines = memory.content.split('\n');
    const bulletPattern = /^[-*•]\s+(.+)$/;
    
    const items: string[] = [];
    let regularContent = '';
    
    lines.forEach(line => {
      const match = line.match(bulletPattern);
      if (match && match[1]) {
        items.push(match[1].trim());
      } else if (line.trim()) {
        regularContent += line + ' ';
      }
    });
    
    return {
      content: regularContent.trim() || memory.summary,
      items: items
    };
  };
  
  // Handle navigation to memory detail
  const navigateToMemory = (id: string) => {
    router.push(`/memory/${id}`);
  };
  
  // Handle navigation to meeting detail
  const navigateToMeeting = (id: string) => {
    router.push(`/calendar/${id}`);
  };
  
  // Handle "View all" navigation
  const viewAllMemories = () => {
    router.push('/memory-stack'); // Navigate to Memory Stack page
  };
  
  const viewAllMeetings = () => {
    router.push('/calendar'); // Navigate to Calendar page
  };
  
  // Ask Memory Assistant
  const askMemoryAssistant = (question: string) => {
    // In a real app, this would trigger an AI query
    console.log("Asking Memory Assistant:", question);
    // Would open a chat interface or display results
    router.push(`/search?q=${encodeURIComponent(question)}`);
  };

  return (
    <Layout currentPage="Home">
      <div className="flex gap-6 h-full overflow-hidden">
        {/* Main Content - Notes */}
        <div className="flex-1 space-y-6 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Memory Notes</h2>
            <button 
              onClick={viewAllMemories}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          
          <ScrollArea className="flex-1 pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : error ? (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
                {error}
              </div>
            ) : memories.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {memories.map((memory) => {
                  const { content, items } = processMemoryContent(memory);
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
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="mb-4">No memories found</p>
                <button
                  onClick={() => router.push('/new-memory')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                >
                  Add Your First Memory
                </button>
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* Sidebar */}
        <div className="w-96 space-y-6 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Upcoming Meetings</h2>
            <button 
              onClick={viewAllMeetings}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => (
                <MeetingCard 
                  key={meeting.id}
                  id={meeting.id}
                  title={meeting.title}
                  time={meeting.time}
                  duration={meeting.duration}
                  description={meeting.description}
                  items={meeting.items}
                  attendees={meeting.attendees}
                  gradient={meeting.gradient}
                  onClick={navigateToMeeting}
                />
              ))}
            </div>
          </ScrollArea>
          
          <Card className="bg-gradient-to-br from-slate-800/70 to-slate-800/30 border-slate-700 backdrop-blur-sm hover:shadow-md transition-all">
            <CardContent className="p-4">
              <h3 className="font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Memory Assistant</h3>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700">
                <p className="text-sm text-gray-300">
                  <span className="italic">"When did I say I'd get back about the onboarding plan?"</span>
                </p>
              </div>
              <div className="flex mt-3 justify-end">
                <button 
                  onClick={() => askMemoryAssistant("When did I say I'd get back about the onboarding plan?")}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 px-3 py-1.5 text-sm rounded-lg text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer"
                >
                  Ask Memory
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function MemoryCard({ id, title, category, content = "", items = [], gradient, icon, createdAt, onClick }: MemoryCardProps) {
  return (
    <Card 
      className={`bg-gradient-to-br ${gradient} border-none overflow-hidden relative group hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer`}
      onClick={() => onClick(id)}
    >
      <div className="absolute inset-0 bg-slate-900/80"></div>
      <CardContent className="p-4 relative">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-gray-300">{category}</span>
          </div>
          <div className="flex items-center text-xs text-gray-400 gap-1">
            <Clock size={12} />
            <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
          </div>
        </div>
        <h2 className="font-bold text-white mb-2">{title}</h2>
        {content && (
          <p className="text-sm text-gray-300 line-clamp-3">{content}</p>
        )}
        {items && items.length > 0 && (
          <ul className="list-disc list-inside text-sm text-gray-300 ml-1 space-y-1 mt-2">
            {items.slice(0, 3).map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
            {items.length > 3 && (
              <li className="text-gray-400">+{items.length - 3} more items</li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function MeetingCard({ id, title, time, duration, description, items = [], attendees, gradient, onClick }: MeetingCardProps) {
  return (
    <Card 
      className="bg-slate-800/50 border-slate-700 overflow-hidden relative group cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
      onClick={() => onClick(id)}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-white">{title}</h3>
            <div className="flex items-center text-xs text-gray-400 gap-1">
              <Calendar size={12} />
              <span>{time}</span>
            </div>
          </div>
          <span className={`bg-${attendees[0].color}-500/20 text-${attendees[0].color}-300 px-2 py-1 rounded-full text-xs`}>
            {duration} min
          </span>
        </div>
        <p className="text-sm text-gray-300">
          {description}
        </p>
        {items && items.length > 0 && (
          <ul className="list-disc list-inside text-sm text-gray-300 ml-1 space-y-1 mt-2">
            {items.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
        <div className="flex mt-3 gap-2 items-center">
          {attendees.slice(0, 3).map((attendee, index) => (
            <Avatar key={index} className="h-6 w-6">
              <AvatarFallback className={`bg-${attendee.color}-500/20 text-${attendee.color}-300 text-xs`}>
                {attendee.initials}
              </AvatarFallback>
            </Avatar>
          ))}
          {attendees.length > 3 && (
            <span className="text-xs text-gray-400 self-center">+{attendees.length - 3} more</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}