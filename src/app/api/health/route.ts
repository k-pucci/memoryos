// app/api/health/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Missing Supabase environment variables', 
          hint: 'Check your .env.local file for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
        },
        { status: 500 }
      );
    }
    
    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Use the simplest possible query to check connectivity
    // This just gets metadata about the client's configuration
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Failed to connect to Supabase', 
          error: error.message,
          hint: 'Verify your Supabase URL and API key'
        },
        { status: 500 }
      );
    }
    
    // Return success with client info
    return NextResponse.json({
      status: 'healthy',
      message: 'Successfully connected to Supabase',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      supabaseUrl: supabaseUrl?.replace(/^(https?:\/\/[^\/]+).*$/, '$1') // Only show domain for security
    });
    
  } catch (error: any) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error.message,
        hint: 'This might be a configuration issue with your Supabase client'
      },
      { status: 500 }
    );
  }
}