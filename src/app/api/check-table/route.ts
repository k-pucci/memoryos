// app/api/check-table/route.ts
import { SystemService } from '@/lib/services/system-service';
import { ApiResponse } from '@/lib/api/response-utils';

export async function GET() {
  try {
    const status = await SystemService.getSystemStatus();
    return ApiResponse.success(status);
  } catch (error: any) {
    console.error('Error checking system:', error);
    return ApiResponse.serverError(error);
  }
}