// app/api/test-openai/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Test with a simple completion
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say hello to MemoryOS" }],
      max_tokens: 50
    });

    return NextResponse.json({
      status: 'Connected Successfully',
      response: response.choices[0].message.content
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Error',
      error: error.message
    }, { status: 500 });
  }
}