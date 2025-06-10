// app/api/test-supabase/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    // Log connection info (will appear in your server console)
    console.log('Attempting to connect to Supabase:');
    console.log('URL:', supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'Not set');
    console.log('Key length:', supabaseKey ? supabaseKey.length : 'Not set');
    
    // Create client with default options
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if we can connect at all
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    return NextResponse.json({
      connection: 'Success',
      message: 'Successfully connected to Supabase',
      time: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Supabase connection error:', error);
    
    return NextResponse.json({
      connection: 'Failed',
      error: error.message,
      time: new Date().toISOString()
    }, { status: 500 });
  }
}