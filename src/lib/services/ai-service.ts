// lib/services/ai-service.ts - Updated imports
import { groq } from '@/lib/groq';

export class AIService {
  static async generateSummary(content: string): Promise<string> {
    if (!groq || !content) {
      return content.substring(0, 150) + (content.length > 150 ? "..." : "");
    }

    try {
      console.log("🧠 Generating summary with Groq...");
      const summaryResponse = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: "You are a summarization assistant. Create a concise summary (max 150 characters) of the following content. Be brief and capture the key points.",
          },
          {
            role: "user",
            content,
          },
        ],
        max_tokens: 50,
        temperature: 0.3,
      });

      const summary = summaryResponse.choices[0]?.message?.content;
      console.log("✅ Summary generated with Groq");
      return summary || this.getFallbackSummary(content);
    } catch (err) {
      console.error("🔴 Error generating summary with Groq:", err);
      return this.getFallbackSummary(content);
    }
  }

  private static getFallbackSummary(content: string): string {
    return content.substring(0, 150) + (content.length > 150 ? "..." : "");
  }

  static validateEmbedding(embedding: any): number[] | null {
    if (embedding && Array.isArray(embedding) && embedding.length === 384) {
      console.log("🔗 Using client-generated embedding (384 dimensions)");
      return embedding;
    } else if (embedding) {
      console.log("⚠️ Invalid embedding provided, skipping...");
    } else {
      console.log("ℹ️ No embedding provided");
    }
    return null;
  }
}