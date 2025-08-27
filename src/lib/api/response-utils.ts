// lib/api/response-utils.ts - Standardized responses
import { NextResponse } from "next/server";

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
  }
};