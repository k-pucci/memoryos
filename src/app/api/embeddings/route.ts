import { pipeline } from "@xenova/transformers";
import { NextRequest, NextResponse } from "next/server";

let embedder: any = null;

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Initialize embedder if not already done
    if (!embedder) {
      console.log("🤖 Loading embedding model...");
      embedder = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
      console.log("✅ Embedding model loaded!");
    }

    const output = await embedder(text, {
      pooling: "mean",
      normalize: true,
    });

    return NextResponse.json({
      embedding: Array.from(output.data),
    });
  } catch (error) {
    console.error("Embedding API error:", error);
    return NextResponse.json(
      { error: "Failed to generate embedding" },
      { status: 500 }
    );
  }
}
