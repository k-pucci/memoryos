// app/api/memories/route.ts - GET endpoint for browsing all memories
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ApiResponse } from '@/lib/api/response-utils';

export async function GET(request: Request) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse URL params for optional filtering
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const category = url.searchParams.get('category');
    const memory_type = url.searchParams.get('memory_type');

    console.log("📚 Fetching memories for user:", user.id, { limit, category, memory_type });

    // Build query
    let queryBuilder = supabaseAdmin
      .from("memories")
      .select("id, title, content, summary, category, memory_type, tags, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply optional filters
    if (category) {
      queryBuilder = queryBuilder.eq("category", category);
    }
    
    if (memory_type) {
      queryBuilder = queryBuilder.eq("memory_type", memory_type);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    console.log(`✅ Fetched ${data?.length || 0} memories`);

    return ApiResponse.success({ 
      results: data || [],
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error("❌ Error fetching memories:", error);
    return ApiResponse.serverError({ 
      error: "Failed to fetch memories",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}