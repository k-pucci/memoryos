// app/api/health/route.ts
import { ApiResponse } from "@/lib/api/clients";
import { SystemService } from "@/lib/services/system-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const verbose = searchParams.get('verbose') === 'true';
    
    if (verbose) {
      console.log('Verbose health check requested...');
    }
    
    const health = await SystemService.checkHealth(verbose);
    return ApiResponse.success(health);
  } catch (error: any) {
    return ApiResponse.error(error.message, 500);
  }
}