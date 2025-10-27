// lib/api/server-clients.ts - Server-side only
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

// This should ONLY be used in API routes or server components
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;