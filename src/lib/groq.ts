// /src/lib/groq.ts
import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY environment variable is required");
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy-key",
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
  // Prepare context from relevant memories
  const context = relevantMemories
    .slice(0, 3)
    .map(
      (memory) =>
        `**${memory.title}**\n*"${memory.content.substring(0, 200)}${
          memory.content.length > 200 ? "..." : ""
        }"*`
    )
    .join("\n\n");

  // Agent personality prompts
  const systemPrompts = {
    helper: `You are a helpful AI assistant for Cognote, a personal knowledge management system. Help users find information in their memories and answer questions based on their stored knowledge. Be conversational, helpful, and reference specific memories when relevant.

If memories are provided, use them to give specific, personalized answers. If no relevant memories are found, let the user know and suggest they create memories about the topic they're asking about.`,

    analyzer: `You are an analytical AI assistant that identifies patterns, connections, and insights from the user's memories. Focus on finding relationships between different memories, highlighting important trends, and providing data-driven insights.

Look for patterns across memories, identify recurring themes, and suggest connections the user might not have noticed.`,

    summarizer: `You are a concise AI assistant that summarizes information from memories. Provide clear, structured summaries and highlight the most important points from the user's knowledge base.

Create organized summaries that capture the key insights and main points from the relevant memories.`,
  };

  if (!process.env.GROQ_API_KEY) {
    console.error("❌ Groq API key not found");
    return `I'm sorry, but the AI agent is not properly configured. Please check that the GROQ_API_KEY environment variable is set.`;
  }

  try {
    console.log("🤖 Asking Groq AI...");
    console.log(
      `📝 Context: ${context ? "Using relevant memories" : "No memories found"}`
    );

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: `${systemPrompts[agentType]}\n\n${
            context
              ? `Here are the user's relevant memories:\n\n${context}`
              : "No relevant memories found for this query."
          }`,
        },
        { role: "user", content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("No response from Groq API");
    }

    console.log("✅ Groq response received");
    return response;
  } catch (error: any) {
    console.error("❌ Groq API error:", error);

    // Provide helpful error messages based on the error type
    if (error?.status === 429) {
      return "The AI agent is currently busy (rate limit reached). Please try again in a moment.";
    } else if (error?.status === 401) {
      return "The AI agent is not properly authenticated. Please check the API configuration.";
    } else if (error?.status === 500) {
      return "The AI service is temporarily unavailable. Please try again later.";
    } else if (error.message?.includes("fetch")) {
      return "Unable to connect to the AI service. Please check your internet connection and try again.";
    }

    // Fallback response with memory context if available
    if (relevantMemories.length > 0) {
      let fallbackResponse = `I found ${relevantMemories.length} relevant memories about "${message}" but couldn't process them with AI right now:\n\n`;
      relevantMemories.slice(0, 2).forEach((memory: any, index: number) => {
        fallbackResponse += `${index + 1}. **${memory.title}**\n`;
      });
      return fallbackResponse;
    }

    return "Sorry, there was an error processing your request, and I couldn't find any relevant memories to help with your question.";
  }
}
