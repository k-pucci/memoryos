import { NextRequest } from 'next/server';
import { ChatService } from '@/lib/services/chat-service';
import { ApiResponse, withAuth } from '@/lib/api/response-utils';

export async function GET(request: NextRequest) {
  return withAuth(request, async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');

      const sessions = await ChatService.getUserChatSessions(user.id, limit);
      
      return ApiResponse.success({ sessions });
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      return ApiResponse.serverError(error);
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (request, user) => {
    try {
      const body = await request.json();
      const { title } = body;

      const session = await ChatService.createChatSession(user.id, title);
      
      return ApiResponse.success({ session });
    } catch (error) {
      console.error('Error creating chat session:', error);
      return ApiResponse.serverError(error);
    }
  });
}