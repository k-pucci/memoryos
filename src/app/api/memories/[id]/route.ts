import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Groq client (free!)
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// GET a specific memory by ID
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

  try {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("🔴 GET error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("🔴 GET exception:", error);
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
      source_url,
      embedding, // Accept client-generated embedding for updates
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Generate summary using Groq (free!)
    let summary;
    if (groq && content) {
      try {
        console.log("🧠 Generating summary with Groq...");
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
              content,
            },
          ],
          max_tokens: 50,
          temperature: 0.3,
        });

        summary = summaryResponse.choices[0]?.message?.content;
        console.log("✅ Summary generated with Groq");
      } catch (err) {
        console.error("🔴 Error generating summary with Groq:", err);
        // Fallback to truncated content
        summary =
          content.substring(0, 150) + (content.length > 150 ? "..." : "");
      }
    } else {
      // Fallback summary if no Groq
      summary = content.substring(0, 150) + (content.length > 150 ? "..." : "");
    }

    // Use client-generated embedding if provided
    let finalEmbedding = null;
    if (embedding && Array.isArray(embedding) && embedding.length === 384) {
      console.log("🔗 Using client-generated embedding (384 dimensions)");
      finalEmbedding = embedding;
    } else if (embedding) {
      console.log("⚠️ Invalid embedding provided, skipping...");
    } else {
      console.log("ℹ️ No embedding provided, keeping existing embedding");
      // Don't update the embedding field if none provided
      // This preserves the existing embedding in the database
    }

    const updateData: any = {
      title,
      category,
      memory_type,
      content,
      summary,
      tags,
      has_reminder,
      source_url,
      updated_at: new Date().toISOString(),
    };

    // Only update embedding if a new one was provided
    if (finalEmbedding) {
      updateData.embedding = finalEmbedding;
    }

    const { data, error } = await supabase
      .from("memories")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("🔴 PUT error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: data[0].id,
      message: "Memory updated successfully",
      hasSummary: !!summary,
      hasEmbedding: !!finalEmbedding,
    });
  } catch (error: any) {
    console.error("🔴 PUT exception:", error);
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
    const { error } = await supabase.from("memories").delete().eq("id", id);

    if (error) {
      console.error("🔴 DELETE error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Memory deleted successfully",
    });
  } catch (error: any) {
    console.error("🔴 DELETE exception:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
