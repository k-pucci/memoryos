// src/app/notifications/page.tsx

"use client";

import React from "react";
import Layout from "@/components/layout";
import {
  Bell,
  CheckCheck,
  Clock,
  Calendar,
  User,
  Settings,
  Star,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  return (
    <Layout currentPage="Notifications">
      <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="text-primary" size={24} />
            <h1 className="text-3xl font-bold text-foreground">
              Notifications
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all h-10">
              <Filter size={16} />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all h-10">
              <CheckCheck size={16} />
              Mark all as read
            </button>
          </div>
        </div>

        {/* Notification Categories */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { label: "All", count: 12, active: true },
            { label: "Unread", count: 5 },
            { label: "Mentions", count: 3 },
            { label: "System", count: 4 },
          ].map((category, index) => (
            <button
              key={index}
              className={cn(
                "px-4 py-2 rounded-full text-sm flex items-center font-medium transition-all h-10",
                category.active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {category.label}
              <span
                className={cn(
                  "ml-2 px-2 py-1 rounded-full text-xs",
                  category.active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-accent text-accent-foreground"
                )}
              >
                {category.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 min-h-0">
          <div className="h-full overflow-y-auto pr-2 -mr-2">
            <div className="space-y-6 pb-8">
              <div className="text-sm text-muted-foreground mb-4 font-semibold">
                Today
              </div>

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

              <div className="text-sm text-muted-foreground mt-8 mb-4 font-semibold">
                Yesterday
              </div>

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

              <div className="text-sm text-muted-foreground mt-8 mb-4 font-semibold">
                Last Week
              </div>

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
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Notification Card Component
interface NotificationCardProps {
  title: string;
  message: string;
  time: string;
  type: "ai" | "mention" | "update" | "system" | "reminder" | "deadline";
  read: boolean;
}

function NotificationCard({
  title,
  message,
  time,
  type,
  read,
}: NotificationCardProps) {
  const getIcon = () => {
    switch (type) {
      case "ai":
        return <Star className="text-purple-500" size={18} />;
      case "mention":
        return <User className="text-blue-500" size={18} />;
      case "update":
        return <Settings className="text-emerald-500" size={18} />;
      case "system":
        return <Bell className="text-amber-500" size={18} />;
      case "reminder":
        return <Clock className="text-pink-500" size={18} />;
      case "deadline":
        return <Calendar className="text-indigo-500" size={18} />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "ai":
        return "border-l-purple-500";
      case "mention":
        return "border-l-blue-500";
      case "update":
        return "border-l-emerald-500";
      case "system":
        return "border-l-amber-500";
      case "reminder":
        return "border-l-pink-500";
      case "deadline":
        return "border-l-indigo-500";
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case "ai":
        return "bg-purple-500/10";
      case "mention":
        return "bg-blue-500/10";
      case "update":
        return "bg-emerald-500/10";
      case "system":
        return "bg-amber-500/10";
      case "reminder":
        return "bg-pink-500/10";
      case "deadline":
        return "bg-indigo-500/10";
    }
  };

  return (
    <Card
      className={cn(
        "bg-card border-border overflow-hidden relative group hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer border-l-4 card-shadow",
        getBorderColor(),
        !read && "ring-2 ring-primary/10"
      )}
    >
      <CardContent className={cn("p-6", !read && "bg-primary/5")}>
        <div className="flex gap-4">
          <div
            className={cn(
              "rounded-full p-3 h-fit flex-shrink-0",
              getIconBgColor()
            )}
          >
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3
                className={cn(
                  "font-semibold text-base leading-tight",
                  !read ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {title}
              </h3>
              {!read && (
                <span className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 ml-3 mt-1"></span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {message}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground/80 font-medium">
                {time}
              </span>

              {type === "mention" && (
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarFallback className="bg-blue-500/20 text-blue-500 text-xs font-medium">
                    AR
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
