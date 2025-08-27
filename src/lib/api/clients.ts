// lib/api/clients.ts - Centralized client initialization
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { PostHog } from 'posthog-node';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

export const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com' }
);

// lib/api/response-utils.ts - Standardized responses
import { NextResponse } from "next/server";

export const ApiResponse = {
  success: <T>(data: T, status = 200) => 
    NextResponse.json({ success: true, ...data }, { status }),
    
  error: (message: string, status = 400) => {
    console.error(`🔴 API Error (${status}):`, message);
    return NextResponse.json({ error: message }, { status });
  },
    
  serverError: (error: any) => {
    console.error("🔴 Server Exception:", error);
    return NextResponse.json({ 
      error: error.message || "Internal server error",
      errorDetails: {
        name: error.name,
        code: error.code,
        details: error.details,
      }
    }, { status: 500 });
  }
};