// app/api/memories/create/route.ts
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Groq client (free!)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(request: Request) {
  try {
    // Log that we're starting the request
    console.log("Starting memory creation process...");

    // Parse the request body
    const body = await request.json();
    console.log("Received data:", JSON.stringify(body, null, 2));

    const {
      title,
      category,
      memory_type,
      content,
      tags,
      has_reminder,
      source_url,
      embedding, // Accept client-generated embedding
    } = body;

    // Validate inputs
    if (!title || !content) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    console.log("Validation passed, processing data...");

    // Parse tags if they are a comma-separated string
    let parsedTags = tags;
    if (typeof tags === "string") {
      parsedTags = tags
        .split(",")
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag);
    }

    console.log("Generating summary using Groq (free)...");

    // Generate summary using Groq (free!)
    let summary;
    try {
      const summaryResponse = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are a summarization assistant. Create a concise summary (max 150 characters) of the following content. Be brief and capture the key points.",
          },
          {
            role: "user",
            content: content,
          },
        ],
        max_tokens: 50,
        temperature: 0.3, // Lower temperature for more focused summaries
      });

      summary = summaryResponse.choices[0]?.message?.content;
      console.log("Summary generated successfully with Groq");
    } catch (err: any) {
      console.error("Error generating summary with Groq:", err);
      // Continue without a summary if Groq fails
      summary = content.substring(0, 150) + (content.length > 150 ? "..." : "");
      console.log("Using fallback summary");
    }

    // Use client-generated embedding if provided, otherwise skip
    let finalEmbedding = null;
    if (embedding && Array.isArray(embedding) && embedding.length === 384) {
      console.log("Using client-generated embedding (384 dimensions)");
      finalEmbedding = embedding;
    } else if (embedding) {
      console.log("Invalid embedding provided, skipping...");
    } else {
      console.log(
        "No embedding provided, storing without semantic search capability"
      );
    }

    console.log("Storing in database...");

    // Store in database
    const { data, error } = await supabase
      .from("memories")
      .insert([
        {
          title,
          category: category || "Research",
          memory_type: memory_type || "Note",
          content,
          summary,
          tags: parsedTags,
          has_reminder: has_reminder || false,
          source_url,
          embedding: finalEmbedding, // Use client-generated embedding
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log("Memory created successfully");

    return NextResponse.json({
      success: true,
      id: data?.[0]?.id,
      message: "Memory created successfully",
      hasEmbedding: !!finalEmbedding, // Indicate if semantic search is available
      hasSummary: !!summary, // Indicate if AI summary was generated
    });
  } catch (error: any) {
    console.error("Error storing memory:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to store memory",
        errorDetails: {
          name: error.name,
          code: error.code,
          details: error.details,
        },
      },
      { status: 500 }
    );
  }
}
