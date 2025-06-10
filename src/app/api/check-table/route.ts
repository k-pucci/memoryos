// app/api/check-table/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if memories table exists and has the expected structure
    console.log('Checking table structure...');
    
    // This gets table information
    const { data: tableInfo, error: tableError } = await supabase
      .from('memories')
      .select('*')
      .limit(0);
      
    if (tableError) {
      if (tableError.code === '42P01') {
        return NextResponse.json({
          exists: false,
          message: 'The memories table does not exist. Please run the SQL setup script.',
          error: tableError.message
        });
      } else {
        return NextResponse.json({
          exists: false,
          message: 'Error checking the memories table',
          error: tableError.message
        });
      }
    }
    
    // Check if pgvector extension is installed
    const { data: pgvectorInfo, error: pgvectorError } = await supabase
      .rpc('check_extension', { extension_name: 'vector' });
      
    const pgvectorInstalled = !pgvectorError && pgvectorInfo;
    
    // Check if functions exist
    const { data: functionInfo, error: functionError } = await supabase
      .rpc('get_category_counts');
      
    const functionsExist = !functionError;
    
    return NextResponse.json({
      exists: true,
      pgvectorInstalled,
      functionsExist,
      message: 'Table check completed',
      pgvectorError: pgvectorError ? pgvectorError.message : null,
      functionError: functionError ? functionError.message : null
    });
  } catch (error: any) {
    console.error('Error checking table:', error);
    
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}