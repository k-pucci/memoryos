import { ChatService } from '@/lib/services/chat-service';
import { ApiResponse, withAuth } from '@/lib/api/response-utils';

// GET messages for a session
export async function GET(
  request: Request,
  context: { params: { sessionId: string } }
) {
  return withAuth(request, async (request, user) => {
    try {
      const { sessionId } = await context.params;
      const messages = await ChatService.getChatSessionMessages(sessionId, user.id);

      return ApiResponse.success({ messages });
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return ApiResponse.serverError(error);
    }
  });
}

export async function DELETE(
  request: Request,
  context: { params: { sessionId: string } }
) {
  return withAuth(request, async (request, user) => {
    try {
      const { sessionId } = await context.params;
      await ChatService.deleteChatSession(sessionId, user.id);

      return ApiResponse.success({ message: 'Session deleted successfully' });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      return ApiResponse.serverError(error);
    }
  });
}

export async function PATCH(
  request: Request,
  context: { params: { sessionId: string } }
) {
  return withAuth(request, async (request, user) => {
    try {
      const { sessionId } = await context.params;
      const body = await request.json();
      const { title } = body;

      await ChatService.updateChatSessionTitle(sessionId, user.id, title);

      return ApiResponse.success({ message: 'Session title updated successfully' });
    } catch (error) {
      console.error('Error updating chat session:', error);
      return ApiResponse.serverError(error);
    }
  });
}