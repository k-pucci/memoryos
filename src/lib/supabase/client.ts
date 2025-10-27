// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required but not found')
  }
  
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required but not found')
  }
  
  console.log('✅ Creating Supabase client with URL:', url.substring(0, 30) + '...')
  
  return createBrowserClient(url, key)
}