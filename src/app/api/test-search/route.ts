import { InternalSearchService } from '@/lib/services/search-service-internal';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" });
    }

    console.log("🧪 Testing InternalSearchService for user:", user.id);

    // Test the internal search service directly
    const memories = await InternalSearchService.searchMemoriesForUser(
      "meeting",
      user.id,
      undefined, // no embedding
      10
    );

    console.log("🧪 Test search returned:", memories.length, "memories");

    return Response.json({ 
      success: true, 
      memories,
      userId: user.id,
      count: memories.length 
    });
  } catch (error: any) {
    console.error("🧪 Test search error:", error);
    return Response.json({ error: error.message });
  }
}