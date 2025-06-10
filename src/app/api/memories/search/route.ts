import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Setup Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// OpenAI (optional)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: Request) {
  try {
    console.log('🔵 /api/memories/search hit');

    const { query } = await request.json();
    console.log('🟢 Received query:', query);

    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ results: data });
  } catch (error: any) {
    console.error('🔴 Error in simplified search route:', error);
    return NextResponse.json({ error: 'Failed to search memories' }, { status: 500 });
  }
}
