"use client";

import React from "react";
import Layout from "@/components/layout";
import { Bell, CheckCheck, Clock, Calendar, User, Settings, Star, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function NotificationsPage() {
  return (
    <Layout currentPage="Notifications">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="text-purple-400 mr-2" size={22} />
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-slate-800/70 text-gray-300 hover:bg-slate-700/70 transition-all">
              <Filter size={14} className="mr-1" />
              Filter
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-slate-800/70 text-gray-300 hover:bg-slate-700/70 transition-all">
              <CheckCheck size={14} className="mr-1" />
              Mark all as read
            </button>
          </div>
        </div>
        
        {/* Notification Categories */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "All", count: 12, active: true },
            { label: "Unread", count: 5 },
            { label: "Mentions", count: 3 },
            { label: "System", count: 4 },
          ].map((category, index) => (
            <button
              key={index}
              className={`px-3 py-1.5 rounded-full text-sm flex items-center ${
                category.active 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                  : 'bg-slate-800/50 text-gray-300 border border-slate-700 hover:bg-slate-700/50 transition-all'
              }`}
            >
              {category.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                category.active ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-700 text-gray-300'
              }`}>
                {category.count}
              </span>
            </button>
          ))}
        </div>
        
        {/* Notifications List */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-2">Today</div>
            
            <NotificationCard 
              title="Memory Assistant found a relevant note"
              message="I found a note about 'onboarding documentation' that matches your recent query."
              time="2 hours ago"
              type="ai"
              read={false}
            />
            
            <NotificationCard 
              title="Meeting Reminder: Client Check-in"
              message="Your meeting starts in 30 minutes. The agenda has been updated."
              time="3 hours ago"
              type="reminder"
              read={false}
            />
            
            <NotificationCard 
              title="Alex Ramirez mentioned you"
              message="@user Can you share the onboarding documentation we discussed yesterday?"
              time="5 hours ago"
              type="mention"
              read={false}
            />
            
            <div className="text-sm text-gray-400 mt-6 mb-2">Yesterday</div>
            
            <NotificationCard 
              title="Your memory 'Project Roadmap Discussion' was updated"
              message="Changes were made to the memory you created. Tap to view the changes."
              time="1 day ago"
              type="update"
              read={true}
            />
            
            <NotificationCard 
              title="Task deadline approaching"
              message="The task 'Complete onboarding documentation' is due tomorrow."
              time="1 day ago"
              type="deadline"
              read={true}
            />
            
            <div className="text-sm text-gray-400 mt-6 mb-2">Last Week</div>
            
            <NotificationCard 
              title="Your reminder: Follow up with marketing team"
              message="You set a reminder to follow up with the marketing team about the new campaign."
              time="3 days ago"
              type="reminder"
              read={true}
            />
            
            <NotificationCard 
              title="System maintenance completed"
              message="The scheduled system maintenance has been completed successfully."
              time="5 days ago"
              type="system"
              read={true}
            />
          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
}

// Notification Card Component
interface NotificationCardProps {
  title: string;
  message: string;
  time: string;
  type: 'ai' | 'mention' | 'update' | 'system' | 'reminder' | 'deadline';
  read: boolean;
}

function NotificationCard({ title, message, time, type, read }: NotificationCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'ai':
        return <Star className="text-purple-400" size={18} />;
      case 'mention':
        return <User className="text-blue-400" size={18} />;
      case 'update':
        return <Settings className="text-emerald-400" size={18} />;
      case 'system':
        return <Bell className="text-amber-400" size={18} />;
      case 'reminder':
        return <Clock className="text-pink-400" size={18} />;
      case 'deadline':
        return <Calendar className="text-indigo-400" size={18} />;
    }
  };
  
  const getBorderColor = () => {
    switch (type) {
      case 'ai':
        return "border-l-purple-500";
      case 'mention':
        return "border-l-blue-500";
      case 'update':
        return "border-l-emerald-500";
      case 'system':
        return "border-l-amber-500";
      case 'reminder':
        return "border-l-pink-500";
      case 'deadline':
        return "border-l-indigo-500";
    }
  };
  
  return (
    <Card className={`bg-slate-800/50 ${!read ? 'border-slate-700' : 'border-slate-800'} overflow-hidden relative group hover:shadow-lg transition-all cursor-pointer border-l-4 ${getBorderColor()}`}>
      <CardContent className={`p-4 ${!read ? 'bg-slate-800/80' : ''}`}>
        <div className="flex gap-3">
          <div className="bg-slate-900/60 rounded-full p-2 h-fit">
            {getIcon()}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <h3 className={`font-semibold ${!read ? 'text-white' : 'text-gray-300'}`}>{title}</h3>
              {!read && (
                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-2">{message}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{time}</span>
              
              {type === 'mention' && (
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-blue-500/20 text-blue-300 text-xs">AR</AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}