import { NextRequest } from 'next/server';
import { ChatService } from '@/lib/services/chat-service';
import { ApiResponse, withAuth } from '@/lib/api/response-utils';

interface RouteParams {
  params: { sessionId: string };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (request, user) => {
    try {
      await ChatService.deleteChatSession(params.sessionId, user.id);
      
      return ApiResponse.success({ message: 'Session deleted successfully' });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      return ApiResponse.serverError(error);
    }
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (request, user) => {
    try {
      const body = await request.json();
      const { title } = body;

      await ChatService.updateChatSessionTitle(params.sessionId, user.id, title);
      
      return ApiResponse.success({ message: 'Session title updated successfully' });
    } catch (error) {
      console.error('Error updating chat session:', error);
      return ApiResponse.serverError(error);
    }
  });
}