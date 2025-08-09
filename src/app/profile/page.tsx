// src/app/profile/page.tsx

"use client";

import React from "react";
import Layout from "@/components/layout";
import {
  User,
  Mail,
  Clock,
  Shield,
  Lock,
  BellRing,
  Moon,
  Globe,
  LifeBuoy,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  return (
    <Layout currentPage="">
      <div className="space-y-6 overflow-auto max-h-[calc(100vh-130px)] pr-2 pb-8">
        <div className="flex items-center">
          <User className="text-primary mr-2" size={22} />
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Overview */}
          <div className="md:w-1/3">
            <Card className="bg-card border-border card-shadow overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-purple-500/30 to-blue-500/30"></div>
              <CardContent className="p-6 relative">
                <Avatar className="h-20 w-20 border-4 border-card absolute -top-10">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-xl text-white">
                    MS
                  </AvatarFallback>
                </Avatar>

                <div className="mt-12 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      Memory Smith
                    </h2>
                    <p className="text-muted-foreground">
                      memory.smith@example.com
                    </p>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock size={14} className="mr-1" />
                    <span>Member since May 2025</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1.5 bg-primary/20 text-primary rounded-full text-xs font-medium">
                      Pro Plan
                    </div>
                    <div className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                      92 Memories
                    </div>
                    <div className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                      8 Stacks
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-4 text-foreground">
              Account Settings
            </h2>

            <div className="space-y-4">
              <Card className="bg-card border-border card-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold flex items-center mb-4 text-foreground">
                    <User size={16} className="mr-2 text-primary" />
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Full Name
                      </label>
                      <Input
                        defaultValue="Memory Smith"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Display Name
                      </label>
                      <Input
                        defaultValue="Memory Smith"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Email
                      </label>
                      <Input
                        defaultValue="memory.smith@example.com"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Location
                      </label>
                      <Input
                        defaultValue="San Diego, CA"
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border card-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold flex items-center mb-4 text-foreground">
                    <Shield size={16} className="mr-2 text-primary" />
                    Security
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Password
                      </label>
                      <Input
                        type="password"
                        defaultValue="••••••••••••"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="2fa"
                          className={cn(
                            "w-4 h-4 rounded text-primary",
                            "bg-background border-border",
                            "focus:ring-primary/20 focus:ring-2"
                          )}
                          defaultChecked
                        />
                        <label
                          htmlFor="2fa"
                          className="ml-2 text-sm text-foreground"
                        >
                          Enable two-factor authentication
                        </label>
                      </div>
                      <button className="text-primary text-sm hover:text-primary/80 transition-colors">
                        Set up
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsCard
                  icon={<BellRing size={16} className="mr-2 text-primary" />}
                  title="Notifications"
                  description="Manage how and when you receive alerts"
                />

                <SettingsCard
                  icon={<Moon size={16} className="mr-2 text-primary" />}
                  title="Appearance"
                  description="Configure theme and display preferences"
                />

                <SettingsCard
                  icon={<Globe size={16} className="mr-2 text-primary" />}
                  title="Language & Region"
                  description="Change language and regional settings"
                />

                <SettingsCard
                  icon={<LifeBuoy size={16} className="mr-2 text-primary" />}
                  title="Support"
                  description="Get help and contact customer support"
                />
              </div>

              <button className="flex items-center mt-6 text-destructive hover:text-destructive/80 transition-colors">
                <LogOut size={16} className="mr-2" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Settings Card Component
interface SettingsCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function SettingsCard({ icon, title, description }: SettingsCardProps) {
  return (
    <Card className="bg-card border-border card-shadow hover:border-primary/30 hover:bg-accent cursor-pointer transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center text-foreground">
              {icon}
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="text-muted-foreground">
            <ChevronRight size={16} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
