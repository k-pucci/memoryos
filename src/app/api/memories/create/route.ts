// app/api/memories/create/route.ts
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    // Log that we're starting the request
    console.log('Starting memory creation process...');
    
    // Parse the request body
    const body = await request.json();
    console.log('Received data:', JSON.stringify(body, null, 2));
    
    const { 
      title, 
      category, 
      memory_type, 
      content, 
      tags,
      has_reminder,
      source_url 
    } = body;

    // Validate inputs
    if (!title || !content) {
      console.log('Missing required fields');
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    console.log('Validation passed, processing data...');

    // Parse tags if they are a comma-separated string
    let parsedTags = tags;
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
    }

    console.log('Generating summary using OpenAI...');
    
    // Generate summary using OpenAI
    let summary;
    try {
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Try using gpt-3.5-turbo first as it's more widely available
        messages: [
          {
            role: "system",
            content: "You are a summarization assistant. Create a concise summary (max 150 characters) of the following content."
          },
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 100
      });
      
      summary = summaryResponse.choices[0].message.content;
      console.log('Summary generated successfully');
    } catch (err: any) {
      console.error('Error generating summary:', err);
      // Continue without a summary if OpenAI fails
      summary = content.substring(0, 150) + (content.length > 150 ? '...' : '');
      console.log('Using fallback summary');
    }

    console.log('Generating embedding...');
    
    // Generate embedding
    let embedding;
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002", // Try using ada-002 as it's more widely available than text-embedding-3-small
        input: content
      });
      
      embedding = embeddingResponse.data[0].embedding;
      console.log('Embedding generated successfully');
    } catch (err: any) {
      console.error('Error generating embedding:', err);
      // If embedding fails, we'll store without it
      embedding = null;
      console.log('Proceeding without embedding');
    }

    console.log('Storing in database...');
    
    // Store in database
    const { data, error } = await supabase
      .from('memories')
      .insert([
        {
          title,
          category: category || 'Research', // Default category if none provided
          memory_type: memory_type || 'Note', // Default type if none provided
          content,
          summary,
          tags: parsedTags,
          has_reminder: has_reminder || false,
          source_url,
          embedding,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Memory created successfully');
    
    return NextResponse.json({ 
      success: true, 
      id: data?.[0]?.id,
      message: "Memory created successfully" 
    });
  } catch (error: any) {
    console.error('Error storing memory:', error);
    
    return NextResponse.json({ 
      error: error.message || 'Failed to store memory',
      errorDetails: {
        name: error.name,
        code: error.code,
        details: error.details
      }
    }, { status: 500 });
  }
}