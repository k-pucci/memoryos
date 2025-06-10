import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client conditionally
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// GET a specific memory by ID
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('🔴 GET error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('🔴 GET exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE a memory
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    const {
      title,
      category,
      memory_type,
      content,
      tags,
      has_reminder,
      source_url
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    let summary;
    if (openai && content) {
      try {
        const summaryResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a summarization assistant. Create a concise summary (max 150 characters) of the following content."
            },
            {
              role: "user",
              content
            }
          ],
          max_tokens: 100
        });

        summary = summaryResponse.choices[0].message.content;
      } catch (err) {
        console.error('🔴 Error generating summary:', err);
      }
    }

    let embedding;
    if (openai && content) {
      try {
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: content
        });

        embedding = embeddingResponse.data[0].embedding;
      } catch (err) {
        console.error('🔴 Error generating embedding:', err);
      }
    }

    const updateData: any = {
      title,
      category,
      memory_type,
      content,
      tags,
      has_reminder,
      source_url,
      updated_at: new Date().toISOString()
    };

    if (summary) updateData.summary = summary;
    if (embedding) updateData.embedding = embedding;

    const { data, error } = await supabase
      .from('memories')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('🔴 PUT error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: data[0].id,
      message: "Memory updated successfully"
    });
  } catch (error: any) {
    console.error('🔴 PUT exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a memory
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

  try {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('🔴 DELETE error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Memory deleted successfully"
    });
  } catch (error: any) {
    console.error('🔴 DELETE exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
