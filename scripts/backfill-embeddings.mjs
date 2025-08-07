import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables:");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("SUPABASE_SERVICE_ROLE_KEY:", !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

let embedder = null;

async function initializeEmbedder() {
  if (embedder) return embedder;

  console.log("🤖 Loading embedding model...");
  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  console.log("✅ Embedding model loaded!");
  return embedder;
}

async function generateEmbedding(text) {
  const model = await initializeEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

async function backfillEmbeddings() {
  try {
    // Get all memories without embeddings
    const { data: memories, error } = await supabase
      .from("memories")
      .select("id, title, content")
      .is("embedding", null);

    if (error) {
      console.error("Error fetching memories:", error);
      return;
    }

    console.log(`Found ${memories.length} memories without embeddings`);

    for (let i = 0; i < memories.length; i++) {
      const memory = memories[i];
      console.log(`Processing ${i + 1}/${memories.length}: ${memory.title}`);

      try {
        // Generate embedding for title + content
        const text = `${memory.title} ${memory.content}`;
        const embedding = await generateEmbedding(text);

        // Update the memory with the embedding
        const { error: updateError } = await supabase
          .from("memories")
          .update({ embedding })
          .eq("id", memory.id);

        if (updateError) {
          console.error(`Error updating memory ${memory.id}:`, updateError);
        } else {
          console.log(`✅ Updated embedding for: ${memory.title}`);
        }

        // Small delay to avoid overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing memory ${memory.id}:`, error);
      }
    }

    console.log("🎉 Backfill complete!");
  } catch (error) {
    console.error("Backfill error:", error);
  }
}

backfillEmbeddings();
