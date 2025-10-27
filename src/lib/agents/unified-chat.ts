// lib/agents/unified-chat.ts - Corrected version
import Groq from "groq-sdk";
import { InternalSearchService } from '@/lib/services/search-service-internal';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
}

interface Memory {
  id: string;
  title: string;
  category: string;
  memory_type: string;
  content: string;
  summary?: string;
  tags?: string[];
  source_url?: string;
  created_at: string;
  updated_at: string;
  meeting_date?: string;
  attendees?: string[];
  action_items?: string[];
  next_steps?: string[];
  priority?: string;
  status?: string;
  similarity?: number;
}

export class MemoryAssistant {
  private readonly systemPrompt = `You are a memory assistant, a helpful AI that specializes in organizing, searching, and summarizing personal memories and knowledge.

Your capabilities:
- Search through memories using semantic similarity
- Summarize memories by category, date, or topic
- Extract insights and patterns from stored information
- Help organize and understand personal knowledge
- Provide actionable insights from meeting notes and action items
- Create weekly reviews and summaries of recent activities

Guidelines:
- Always reference specific memories when providing information
- Use memory titles, dates, and categories to cite your sources
- When summarizing, organize information clearly with headings
- Highlight important action items, next steps, and deadlines
- Be concise but comprehensive in your responses
- If you can't find relevant memories, say so clearly
- For weekly reviews, focus on the past 7 days of activities

Remember: You're working with the user's personal memory collection, so be helpful in organizing and surfacing their stored knowledge.`;

  async processMessage(
    message: string,
    userId: string,
    embedding: number[],
    chatHistory: ChatMessage[] = []
  ) {
    console.log("Processing memory assistant message:", message, "for user:", userId);

    // Search for relevant memories using the internal search service
    const relevantMemories = await this.searchMemories(message, userId, embedding);
    console.log(`Found ${relevantMemories.length} relevant memories`);

    // Generate response
    const response = await this.generateResponse(
      message,
      relevantMemories,
      chatHistory.slice(-6) // Keep last 6 messages for context
    );

    return {
      response: response.content,
      agent_used: "Memory Assistant",
      sources: relevantMemories.slice(0, 5), // Return top 5 sources
      memory_count: relevantMemories.length,
      search_performed: true,
    };
  }

  private async searchMemories(
    query: string,
    userId: string,
    embedding: number[]
  ): Promise<Memory[]> {
    try {
      const memories = await InternalSearchService.searchMemoriesForUser(
        query,
        userId,
        embedding,
        15
      );

      // Filter for weekly review if needed
      if (this.isWeeklyReviewQuery(query)) {
        console.log("Filtering for weekly review (past 7 days)");
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weeklyMemories = memories.filter((memory: Memory) => 
          new Date(memory.created_at) >= weekAgo
        );
        
        console.log(`Found ${weeklyMemories.length} memories from past week`);
        return weeklyMemories;
      }

      return memories;
    } catch (error) {
      console.error("Memory search error:", error);
      return [];
    }
  }

  private isWeeklyReviewQuery(query: string): boolean {
    const queryLower = query.toLowerCase();
    return queryLower.includes("weekly review") || 
           queryLower.includes("week review") ||
           queryLower.includes("this week") ||
           queryLower.includes("past week") ||
           (queryLower.includes("review") && queryLower.includes("week"));
  }

  private async generateResponse(
    query: string,
    memories: Memory[],
    chatHistory: ChatMessage[]
  ) {
    // Build memory context with rich information
    const memoryContext = this.buildMemoryContext(memories);

    // Build chat context
    const chatContext = chatHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // Create context-aware prompt
    const contextPrompt = this.buildContextPrompt(
      query,
      memoryContext,
      chatContext
    );

    try {
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: contextPrompt },
        ],
        max_tokens: 800,
        temperature: 0.4,
      });

      return {
        content:
          completion.choices[0]?.message?.content ||
          "I couldn't generate a response. Please try again.",
      };
    } catch (error) {
      console.error("Response generation error:", error);
      return {
        content:
          "I'm having trouble generating a response right now. Please try again.",
      };
    }
  }

  private buildMemoryContext(memories: Memory[]): string {
    if (memories.length === 0) {
      return "No relevant memories found.";
    }

    return memories
      .map((memory, index) => {
        let context = `**Memory ${index + 1}: ${memory.title}**\n`;
        context += `Category: ${memory.category} | Type: ${memory.memory_type}\n`;
        context += `Created: ${new Date(
          memory.created_at
        ).toLocaleDateString()}\n`;

        if (memory.summary) {
          context += `Summary: ${memory.summary}\n`;
        }

        context += `Content: ${memory.content.substring(0, 300)}${
          memory.content.length > 300 ? "..." : ""
        }\n`;

        if (memory.tags && memory.tags.length > 0) {
          context += `Tags: ${memory.tags.join(", ")}\n`;
        }

        if (memory.action_items && memory.action_items.length > 0) {
          context += `Action Items: ${memory.action_items.join("; ")}\n`;
        }

        if (memory.next_steps && memory.next_steps.length > 0) {
          context += `Next Steps: ${memory.next_steps.join("; ")}\n`;
        }

        if (memory.priority) {
          context += `Priority: ${memory.priority}\n`;
        }

        return context;
      })
      .join("\n---\n");
  }

  private buildContextPrompt(
    query: string,
    memoryContext: string,
    chatContext: string
  ): string {
    let prompt = `User Query: "${query}"\n\n`;

    if (chatContext) {
      prompt += `Recent Conversation:\n${chatContext}\n\n`;
    }

    prompt += `Relevant Memories:\n${memoryContext}\n\n`;

    prompt += `Instructions:
- Answer the user's query using the provided memories as your knowledge base
- Reference specific memories by their titles when citing information
- If asked to summarize or create a weekly review, organize the information clearly with sections/headings
- Include relevant dates, categories, and details from the memories
- If action items or next steps are relevant, highlight them clearly
- For weekly reviews, group memories by category and highlight key activities, achievements, and next steps
- If no relevant memories are found, say so and ask the user to be more specific`;

    return prompt;
  }
}