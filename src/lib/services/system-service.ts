// lib/services/system-service.ts - Enhanced system checks
import { supabase } from '@/lib/api/clients';

export class SystemService {
 static async checkMemoriesTable() {
   // Check if memories table exists and has the expected structure
   console.log('Checking table structure...');
   
   const { data: tableInfo, error: tableError } = await supabase
     .from('memories')
     .select('*')
     .limit(0);
     
   if (tableError) {
     if (tableError.code === '42P01') {
       return {
         exists: false,
         message: 'The memories table does not exist. Please run the SQL setup script.',
         error: tableError.message
       };
     } else {
       return {
         exists: false,
         message: 'Error checking the memories table',
         error: tableError.message
       };
     }
   }

   return { exists: true, tableInfo };
 }

 static async checkPgVector() {
   const { data: pgvectorInfo, error: pgvectorError } = await supabase
     .rpc('check_extension', { extension_name: 'vector' });
     
   return {
     installed: !pgvectorError && pgvectorInfo,
     error: pgvectorError?.message || null
   };
 }

 static async checkFunctions() {
   const { data: functionInfo, error: functionError } = await supabase
     .rpc('get_category_counts');
     
   return {
     exist: !functionError,
     error: functionError?.message || null
   };
 }

 static async getSystemStatus() {
   const [table, pgvector, functions] = await Promise.all([
     this.checkMemoriesTable(),
     this.checkPgVector(),
     this.checkFunctions()
   ]);

   return {
     exists: table.exists,
     pgvectorInstalled: pgvector.installed,
     functionsExist: functions.exist,
     message: 'System check completed',
     errors: {
       table: table.error,
       pgvector: pgvector.error,
       functions: functions.error
     }
   };
 }

 static async checkHealth(verbose: boolean = false) {
   if (verbose) {
     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
     const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
     
     console.log('Verbose health check requested...');
     console.log('Supabase URL:', supabaseUrl);
     console.log('Service Role Key (first 5 chars):', supabaseKey?.substring(0, 5));
   }

   // Check environment variables
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
       
   if (!supabaseUrl || !supabaseKey) {
     throw new Error('Missing Supabase environment variables. Check your .env.local file for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
   }

   if (verbose) {
     console.log('Attempting to connect...');
   }
   
   const startTime = Date.now();
   
   // Test Supabase connectivity
   const { data, error } = await supabase.auth.getSession();
   
   const endTime = Date.now();
   const responseTime = endTime - startTime;
   
   if (verbose) {
     console.log('Response received after', responseTime, 'ms');
   }
       
   if (error) {
     throw new Error(`Failed to connect to Supabase: ${error.message}. Verify your Supabase URL and API key`);
   }
       
   return {
     status: 'healthy',
     message: 'Successfully connected to Supabase',
     timestamp: new Date().toISOString(),
     environment: process.env.NODE_ENV || 'development',
     supabaseUrl: supabaseUrl?.replace(/^(https?:\/\/[^\/]+).*$/, '$1'), // Only show domain for security
     responseTime: verbose ? `${responseTime}ms` : undefined
   };
 }
}