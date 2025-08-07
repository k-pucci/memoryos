import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY environment variable is required");
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface AgentResponse {
  response: string;
  sources: any[];
  agentType: string;
}

export async function askAgent(
  message: string,
  relevantMemories: any[],
  agentType: "helper" | "analyzer" | "summarizer" = "helper"
): Promise<string> {
  const context = relevantMemories
    .slice(0, 3)
    .map((memory) => `Title: ${memory.title}\nContent: ${memory.content}`)
    .join("\n\n---\n\n");

  const systemPrompts = {
    helper: `You are a helpful AI assistant for MemoryOS. Help users find and understand their stored memories. Be conversational and helpful. If no relevant memories are provided, let the user know you couldn't find related memories.`,
    analyzer: `You are an analytical AI assistant that identifies patterns and insights from memories. Focus on connections and trends. If no memories are provided, suggest the user create more memories to analyze.`,
    summarizer: `You are a concise AI assistant that summarizes memories. Provide clear, structured summaries. If no memories are provided, let the user know there's nothing to summarize.`,
  };

  try {
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: `${systemPrompts[agentType]}\n\n${
            context
              ? `Relevant memories:\n${context}`
              : "No relevant memories found."
          }`,
        },
        { role: "user", content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return (
      completion.choices[0]?.message?.content ||
      "Sorry, I could not generate a response."
    );
  } catch (error: any) {
    console.error("Groq API error:", error);
    if (error?.status === 429) {
      return "The AI agent is currently busy (rate limit reached). Please try again in a moment.";
    }
    return "Sorry, there was an error processing your request. Please try again.";
  }
}
