// hooks/useUserProfile.ts - User profile data management
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  full_name: string | null;
  display_name: string | null;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const supabase = createClient();
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, display_name")
          .eq("id", user.id)
          .single();

        if (!error) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchProfile();
  }, [user]);

  const getInitials = (): string => {
    if (!user) return "U";
    
    if (profile?.display_name) {
      return profile.display_name
        .split(" ")
        .map(name => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map(name => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    
    if (user.email) {
      return user.email
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase();
    }
    
    return "U";
  };

  return { profile, getInitials };
}