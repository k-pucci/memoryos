// lib/api/response-utils.ts - Updated imports
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const ApiResponse = {
  success: <T>(data: T, status = 200) => 
    NextResponse.json({ success: true, ...data }, { status }),
    
  error: (message: string, status = 400) => {
    console.error(`🔴 API Error (${status}):`, message);
    return NextResponse.json({ error: message }, { status });
  },
    
  serverError: (error: any) => {
    console.error("🔴 Server Exception:", error);
    return NextResponse.json({ 
      error: error.message || "Internal server error",
      errorDetails: {
        name: error.name,
        code: error.code,
        details: error.details,
      }
    }, { status: 500 });
  },

  unauthorized: (message = "Authentication required") =>
    NextResponse.json({ error: message }, { status: 401 }),
    
  forbidden: (message = "Access denied") =>
    NextResponse.json({ error: message }, { status: 403 })
};

// Auth middleware for API routes
export async function withAuth(
  request: Request,
  handler: (request: Request, user: any) => Promise<NextResponse>
) {
  try {
    const user = await getAuthenticatedUser();
        
    if (!user) {
      return ApiResponse.unauthorized();
    }
        
    return await handler(request, user);
  } catch (error) {
    console.error("Auth middleware error:", error);
    return ApiResponse.serverError(error);
  }
}