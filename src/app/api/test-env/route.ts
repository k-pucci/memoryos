// app/api/test-verbose/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    // Print verbose info
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Role Key (first 5 chars):', supabaseKey.substring(0, 5));
    
    // Create client with debug enabled
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        debug: true
      }
    });
    
    // Try a simple query
    console.log('Attempting to connect...');
    const startTime = Date.now();
    const { data, error } = await supabase.auth.getSession();
    const endTime = Date.now();
    
    console.log('Response received after', endTime - startTime, 'ms');
    
    if (error) {
      console.error('Auth error:', error);
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      responseTime: `${endTime - startTime}ms`,
      message: 'Connection successful'
    });
  } catch (error: any) {
    console.error('Detailed error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      name: error.name
    }, { status: 500 });
  }
}