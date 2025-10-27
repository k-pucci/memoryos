// src/app/profile/page.tsx
"use client";

import React, { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface UserProfile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  memoriesCount: number;
  categoriesCount: number;
  memberSince: string;
}

export default function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    displayName: "",
    email: "",
    location: "",
  });

  // Original values to compare against
  const [originalData, setOriginalData] = useState({
    fullName: "",
    displayName: "",
    email: "",
    location: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // Load profile data
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        setLoading(true);

        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        // Get user stats
        const [memoriesResult, categoriesResult] = await Promise.all([
          supabase
            .from("memories")
            .select("id", { count: "exact" })
            .eq("user_id", user.id),
          supabase
            .from("memories")
            .select("category")
            .eq("user_id", user.id)
        ]);

        const memoriesCount = memoriesResult.count || 0;
        const uniqueCategories = new Set(
          categoriesResult.data?.map(item => item.category) || []
        );

        setProfile(profileData);
        setStats({
          memoriesCount,
          categoriesCount: uniqueCategories.size,
          memberSince: new Date(user.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          }),
        });

        // Set form data
        const formValues = {
          fullName: profileData?.full_name || "",
          displayName: profileData?.display_name || "",
          email: user.email || "",
          location: profileData?.location || "",
        };
        
        setFormData(formValues);
        setOriginalData(formValues);

      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, supabase]);

  // Check if form has been modified
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle save
  const handleSave = async () => {
    if (!user || !hasChanges || saving) return;

    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName.trim() || null,
          display_name: formData.displayName.trim() || null,
          location: formData.location.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update original data to reflect saved state
      setOriginalData({ ...formData });
      
      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          full_name: formData.fullName.trim() || null,
          display_name: formData.displayName.trim() || null,
          location: formData.location.trim() || null,
          updated_at: new Date().toISOString(),
        });
      }
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/login");
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  // Show loading while checking auth or loading profile
  if (authLoading || loading) {
    return (
      <PageLayout currentPage="Profile" title="My Profile" description="Loading...">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Don't render if not authenticated
  if (!user || !profile || !stats) {
    return null;
  }

  // Generate user initials
  const displayName = formData.displayName || formData.fullName || "User";
  const initials = displayName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <PageLayout
      currentPage="Profile"
      title="My Profile"
      description="Manage your account settings and preferences"
      actions={
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={cn(
            "transition-all",
            (!hasChanges || saving) && "opacity-50 cursor-not-allowed"
          )}
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span className="ml-2">Saving...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span className="ml-2">Save Changes</span>
            </>
          )}
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
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="mt-12 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {displayName}
                    </h2>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock size={14} className="mr-1" />
                    <span>Member since {stats.memberSince}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1.5 bg-primary/20 text-primary rounded-full text-xs font-medium">
                      Free Plan
                    </div>
                    <div className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                      {stats.memoriesCount} Memories
                    </div>
                    <div className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                      {stats.categoriesCount} Categories
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
                        placeholder="Enter your full name"
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
                        placeholder="Enter your display name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Email
                      </label>
                      <Input
                        value={formData.email}
                        disabled
                        className="bg-muted border-border text-muted-foreground cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed here. Contact support if needed.
                      </p>
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
                        placeholder="Enter your location"
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
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          // Future: Implement password change functionality
                          toast("Password change feature coming soon!");
                        }}
                      >
                        Change Password
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use a strong, unique password to protect your account.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsCard
                  icon={<Globe size={16} className="mr-2 text-primary" />}
                  title="Language & Region"
                  description="Change language and regional settings"
                  onClick={() => toast("Language settings coming soon!")}
                />

                <SettingsCard
                  icon={<LifeBuoy size={16} className="mr-2 text-primary" />}
                  title="Support"
                  description="Get help and contact customer support"
                  onClick={() => toast("Support features coming soon!")}
                />
              </div>

              <Button 
                variant="destructive" 
                className="mt-6"
                onClick={handleSignOut}
              >
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
  onClick?: () => void;
}

function SettingsCard({ icon, title, description, onClick }: SettingsCardProps) {
  return (
    <Card 
      className="bg-card border-border card-shadow hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all"
      onClick={onClick}
    >
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