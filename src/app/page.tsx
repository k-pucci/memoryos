// src/app/profile/page.tsx
"use client";

import React, { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import {
  User,
  Clock,
  Shield,
  Globe,
  LifeBuoy,
  LogOut,
  ChevronRight,
  Settings,
  Save,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  // Form state
  const [formData, setFormData] = useState({
    fullName: "Memory Smith",
    displayName: "Memory Smith",
    email: "memory.smith@example.com",
    location: "San Diego, CA",
    password: "••••••••••••",
    twoFactor: true,
  });

  // Original values to compare against
  const originalData = {
    fullName: "Memory Smith",
    displayName: "Memory Smith",
    email: "memory.smith@example.com",
    location: "San Diego, CA",
    password: "••••••••••••",
    twoFactor: true,
  };

  // Check if form has been modified
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  // Handle save (placeholder)
  const handleSave = () => {
    // Placeholder - no actual saving
    console.log("Saving profile changes:", formData);
  };
  return (
    <PageLayout
      currentPage="Profile"
      title="My Profile"
      description="Manage your account settings and preferences"
      actions={
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className={cn(
            "transition-all",
            !hasChanges && "opacity-50 cursor-not-allowed"
          )}
        >
          <Save size={18} />
          <span className="ml-2">Save Changes</span>
        </Button>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Profile Overview */}
          <div className="lg:w-1/3">
            <Card className="bg-card border-border card-shadow overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-primary/30 to-accent/30"></div>
              <CardContent className="p-6 relative">
                <Avatar className="h-20 w-20 border-4 border-card absolute -top-10">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xl text-white">
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
                      8 Categories
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="flex-1">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground mb-4">
              <Settings size={20} className="text-primary" />
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
                        value={formData.fullName}
                        onChange={(e) =>
                          handleInputChange("fullName", e.target.value)
                        }
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Display Name
                      </label>
                      <Input
                        value={formData.displayName}
                        onChange={(e) =>
                          handleInputChange("displayName", e.target.value)
                        }
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Email
                      </label>
                      <Input
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Location
                      </label>
                      <Input
                        value={formData.location}
                        onChange={(e) =>
                          handleInputChange("location", e.target.value)
                        }
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
                            "w-4 h-4 rounded text-primary border-2",
                            "bg-background border-border",
                            "focus:ring-primary/20 focus:ring-2",
                            "checked:bg-primary checked:border-primary"
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                      >
                        Set up
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <Button variant="destructive" className="mt-6">
                <LogOut size={16} className="mr-2" />
                <span>Sign out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
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
    <Card className="bg-card border-border card-shadow hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all">
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
