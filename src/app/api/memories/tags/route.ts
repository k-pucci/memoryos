// app/api/memory/tags/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Try to get all unique tags from the memories table
    // First try a direct query to extract tags
    const { data, error } = await supabase
      .from('memories')
      .select('tags');
      
    if (error) {
      console.error('Error fetching tags:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch tags', 
          message: error.message 
        },
        { status: 500 }
      );
    }
    
    // Extract and flatten all tags from all rows
    const allTags = data
      .flatMap(row => row.tags || [])
      .filter(Boolean);
    
    // Get unique tags and sort them alphabetically
    const uniqueTags = [...new Set(allTags)].sort();
    
    return NextResponse.json({ tags: uniqueTags });
  } catch (error: any) {
    console.error('Error processing tags request:', error);
    return NextResponse.json(
      { 
        error: 'Error processing tags request', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}