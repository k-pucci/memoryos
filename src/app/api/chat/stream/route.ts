// app/api/chat/stream/route.ts - Streaming chat endpoint
import { MemoryAssistant } from '@/lib/agents/unified-chat';
import { ChatService } from '@/lib/services/chat-service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { message, embedding, chat_history = [], session_id, retrieval_settings } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const memoryAssistant = new MemoryAssistant();
    let fullResponse = '';
    let sources: any[] = [];

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const generator = memoryAssistant.processMessageStream(
            message,
            user.id,
            embedding,
            chat_history,
            retrieval_settings
          );

          for await (const event of generator) {
            if (event.type === 'sources') {
              sources = event.sources || [];
              // Send sources as a special event
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`)
              );
            } else if (event.type === 'chunk' && event.content) {
              fullResponse += event.content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: event.content })}\n\n`)
              );
            } else if (event.type === 'done') {
              // Save to history if session_id provided
              if (session_id && fullResponse) {
                try {
                  await ChatService.saveMessageToHistory(
                    session_id,
                    message,
                    {
                      response: fullResponse,
                      agent_used: 'Memory Assistant',
                      sources,
                    },
                    user.id
                  );
                } catch (saveError) {
                  console.error('Error saving chat history:', saveError);
                }
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
              );
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'An error occurred' })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream setup error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
