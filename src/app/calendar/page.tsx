"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import Layout from "@/components/layout";

export default function CalendarPage() {
  return (
    <Layout currentPage="Calendar">
      <div className="space-y-6">
        <div className="flex items-center">
          <CalendarIcon className="text-purple-400 mr-2" size={22} />
          <h1 className="text-2xl font-bold">Calendar</h1>
        </div>
        
        <p className="text-gray-300">View and manage your schedule and memory-linked events.</p>
        
        <div className="flex gap-6 h-[calc(100vh-180px)]">
          {/* Calendar View */}
          <Card className="bg-slate-800/50 border-slate-700 flex-1 overflow-hidden">
            <CardContent className="p-4 h-full">
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm text-gray-400 font-medium py-2">
                    {day}
                  </div>
                ))}
                
                {generateCalendarDays().map((day, index) => (
                  <CalendarDay 
                    key={index} 
                    day={day.day} 
                    isCurrentMonth={day.isCurrentMonth} 
                    isToday={day.isToday}
                    hasEvents={day.hasEvents} 
                    eventCount={day.eventCount}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Upcoming Events */}
          <div className="w-96 flex flex-col">
            <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-2">
                {upcomingEvents.map((event, index) => (
                  <EventCard key={index} {...event} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Calendar Day Component
function CalendarDay({ day, isCurrentMonth, isToday, hasEvents, eventCount }: CalendarDayProps) {
  return (
    <div 
      className={`
        rounded-lg p-2 h-20 flex flex-col justify-between transition-all
        ${isCurrentMonth ? 'bg-slate-800/30' : 'bg-slate-800/10 text-gray-500'} 
        ${isToday ? 'border border-purple-500/50 bg-purple-500/10' : 'border border-transparent hover:border-slate-700'} 
        cursor-pointer hover:bg-slate-700/30
      `}
    >
      <div className="text-sm">
        {day}
      </div>
      {hasEvents && (
        <div className="flex justify-end">
          <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full text-xs">
            {eventCount}
          </span>
        </div>
      )}
    </div>
  );
}

// Event Card Component
function EventCard({ title, time, date, attendees, category, color }: EventType) {
  return (
    <Card className={`bg-slate-800/50 border-slate-700 overflow-hidden relative group hover:shadow-lg transition-all`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-${color}-500`}></div>
      <CardContent className="p-4 pt-5">
        <span className={`px-2 py-0.5 rounded-full text-xs bg-${color}-500/20 text-${color}-300 mb-2 inline-block`}>
          {category}
        </span>
        <h3 className="font-bold text-white">{title}</h3>
        
        <div className="flex items-center mt-3 text-sm text-gray-300">
          <Clock size={14} className="mr-1" />
          <span>{time}</span>
          <span className="mx-1">•</span>
          <span>{date}</span>
        </div>
        
        {attendees.length > 0 && (
          <div className="flex items-center mt-2 text-sm text-gray-300">
            <Users size={14} className="mr-1" />
            <span>{attendees.join(', ')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to generate calendar days
function generateCalendarDays() {
  const days = [];
  // Generate 35 days (5 weeks)
  for (let i = 1; i <= 35; i++) {
    const isCurrentMonth = i > 3 && i < 32;
    const day = isCurrentMonth ? i - 3 : (i < 4 ? 28 + i : i - 31);
    
    // Random events for demo
    const hasEvents = Math.random() > 0.7 && isCurrentMonth;
    const eventCount = hasEvents ? Math.floor(Math.random() * 3) + 1 : 0;
    
    days.push({
      day,
      isCurrentMonth,
      isToday: isCurrentMonth && day === 16, // For demo, set today to May 16
      hasEvents,
      eventCount
    });
  }
  return days;
}

// Types
interface CalendarDayProps {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
  eventCount: number;
}

interface EventType {
  title: string;
  time: string;
  date: string;
  attendees: string[];
  category: string;
  color: string;
}

// Sample data
const upcomingEvents: EventType[] = [
  {
    title: "Client Check-in",
    time: "2:00 PM - 2:30 PM",
    date: "Today",
    attendees: ["Jane Doe", "Alex Ramirez"],
    category: "Meeting",
    color: "blue"
  },
  {
    title: "Q1 Planning",
    time: "10:00 AM - 11:00 AM",
    date: "Tomorrow",
    attendees: ["Team Kappa", "Lisa Moore", "3 others"],
    category: "Planning",
    color: "purple"
  },
  {
    title: "Product Demo",
    time: "3:30 PM - 4:30 PM",
    date: "May 18",
    attendees: ["Marketing Team", "Engineering Team"],
    category: "Presentation",
    color: "emerald"
  },
  {
    title: "Weekly Review",
    time: "9:00 AM - 10:00 AM",
    date: "May 22",
    attendees: [],
    category: "Internal",
    color: "amber"
  },
  {
    title: "Developer Meetup",
    time: "6:00 PM - 8:00 PM",
    date: "May 23",
    attendees: [],
    category: "Networking",
    color: "pink"
  }
];