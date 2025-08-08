// /lib/agents/unified-chat.ts
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// User-created agent interface
interface UserAgent {
  id: string;
  name: string;
  description: string;
  expertise: string[]; // Keywords for routing
  system_prompt: string;
  model: string;
  avatar?: string;
  created_by?: string;
  search_config: {
    threshold: number;
    categories: string[];
    time_preference: "recent" | "all" | "archive";
  };
}

// Chat message with agent context
interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  agent_used?: string;
  mentioned_agents?: string[];
  sources?: any[];
  timestamp: string;
}

export class UnifiedChatManager {
  async processMessage(
    message: string,
    embedding: number[],
    chatHistory: ChatMessage[] = [],
    userId: string
  ) {
    console.log("💬 Processing unified chat message:", message);

    // Step 1: Parse @mentions and detect routing intent
    const parsedMessage = this.parseMessage(message);
    console.log("🎯 Parsed message:", parsedMessage);

    // Step 2: Get user's available agents
    const userAgents = await this.getUserAgents(userId);
    console.log(`📊 Found ${userAgents.length} available agents`);

    // Step 3: Route to appropriate agent(s)
    const selectedAgent = await this.routeToAgent(
      parsedMessage,
      userAgents,
      chatHistory
    );

    console.log(`🤖 Selected agent: ${selectedAgent.name}`);

    // Step 4: Search for relevant memories using agent's strategy
    const relevantMemories = await this.searchWithAgent(
      parsedMessage.cleanQuery,
      embedding,
      selectedAgent
    );

    // Step 5: Generate response with agent's personality
    const response = await this.generateResponse(
      parsedMessage.cleanQuery,
      relevantMemories,
      selectedAgent,
      chatHistory.slice(-6) // Last 6 messages for context
    );

    return {
      response: response.content,
      agent_used: selectedAgent.name,
      agent_id: selectedAgent.id,
      sources: relevantMemories.slice(0, 5),
      mentioned_agents: parsedMessage.mentionedAgents,
      search_strategy: selectedAgent.search_config,
      memory_count: relevantMemories.length,
    };
  }

  // Parse @mentions and clean the query
  parseMessage(message: string) {
    const mentionRegex = /@([a-zA-Z0-9\-_]+)/g;
    const mentions = [...message.matchAll(mentionRegex)].map(
      (match: RegExpMatchArray) => match[1]
    );
    const cleanQuery = message.replace(mentionRegex, "").trim();

    return {
      originalMessage: message,
      cleanQuery,
      mentionedAgents: mentions,
      hasMentions: mentions.length > 0,
    };
  }

  // Get user's custom agents + default agents
  async getUserAgents(userId: string): Promise<UserAgent[]> {
    try {
      console.log("🔍 getUserAgents: Fetching custom agents...");

      // Fetch custom agents from database (all active agents for now)
      const { data: customAgents, error } = await supabase
        .from("user_agents")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      console.log("🔍 Raw database response:", { data: customAgents, error });

      if (error) {
        console.error("❌ Error fetching custom agents:", error);
        return this.getDefaultAgents();
      }

      // Transform custom agents to match UserAgent interface
      const transformedCustomAgents: UserAgent[] = (customAgents || []).map(
        (agent) => {
          console.log("🔄 Transforming agent:", agent.name);
          return {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            expertise: agent.expertise || [],
            system_prompt: agent.system_prompt,
            model: agent.model,
            avatar: agent.image_url,
            created_by: agent.created_by || "custom",
            search_config: {
              threshold: agent.search_threshold || 0.4,
              categories: agent.search_categories || [],
              time_preference: agent.time_preference || "recent",
            },
          };
        }
      );

      // Combine with default agents
      const allAgents = [
        ...this.getDefaultAgents(),
        ...transformedCustomAgents,
      ];

      console.log(
        `✅ getUserAgents result: ${transformedCustomAgents.length} custom + ${
          this.getDefaultAgents().length
        } default = ${allAgents.length} total`
      );
      console.log(
        "📋 Custom agents loaded:",
        transformedCustomAgents.map((a) => ({ name: a.name, id: a.id }))
      );

      return allAgents;
    } catch (error) {
      console.error("❌ Exception in getUserAgents:", error);
      return this.getDefaultAgents();
    }
  }

  // Default agents if user hasn't created any
  getDefaultAgents(): UserAgent[] {
    return [
      {
        id: "meeting-assistant",
        name: "Meeting Assistant",
        description: "Helps with meeting notes, action items, and follow-ups",
        expertise: [
          "meeting",
          "call",
          "discussion",
          "action",
          "follow-up",
          "agenda",
        ],
        system_prompt: `You are a meeting specialist. Focus on extracting action items, next steps, and key decisions from meetings. Always provide actionable insights.`,
        model: "llama3-8b-8192",
        created_by: "system",
        search_config: {
          threshold: 0.3,
          categories: ["Meeting", "Work"],
          time_preference: "recent",
        },
      },
      {
        id: "research-analyst",
        name: "Research Analyst",
        description: "Analyzes research, data, and provides insights",
        expertise: [
          "research",
          "analysis",
          "data",
          "study",
          "insight",
          "trend",
        ],
        system_prompt: `You are a research analyst. Synthesize information from multiple sources, identify patterns, and provide data-driven insights.`,
        model: "llama3-70b-8192",
        created_by: "system",
        search_config: {
          threshold: 0.4,
          categories: ["Research", "Analysis"],
          time_preference: "all",
        },
      },
      {
        id: "creative-assistant",
        name: "Creative Assistant",
        description: "Helps with ideas, brainstorming, and creative projects",
        expertise: [
          "idea",
          "creative",
          "brainstorm",
          "concept",
          "design",
          "innovation",
        ],
        system_prompt: `You are a creative catalyst. Help connect ideas, suggest improvements, and provide creative inspiration based on stored concepts.`,
        model: "llama3-8b-8192",
        created_by: "system",
        search_config: {
          threshold: 0.25,
          categories: ["Idea", "Creative", "Project"],
          time_preference: "all",
        },
      },
    ];
  }

  // Route to best agent based on mentions or content analysis
  async routeToAgent(
    parsedMessage: any,
    agents: UserAgent[],
    chatHistory: ChatMessage[]
  ): Promise<UserAgent> {
    // DEBUG: Log everything for troubleshooting
    console.log("🔍 DEBUG routeToAgent:");
    console.log("- Mentioned agents:", parsedMessage.mentionedAgents);
    console.log(
      "- Available agents:",
      agents.map((a) => ({
        name: a.name,
        id: a.id,
        mentionFormat: a.name.toLowerCase().replace(/\s+/g, "-"),
      }))
    );

    // If user @mentioned an agent, use that one
    if (parsedMessage.hasMentions) {
      for (const mention of parsedMessage.mentionedAgents) {
        console.log(`🎯 Looking for mention: "${mention}"`);

        const mentionedAgent = agents.find((agent) => {
          // Check exact name match (converted to mention format)
          const agentMentionFormat = agent.name
            .toLowerCase()
            .replace(/\s+/g, "-");
          console.log(
            `   Comparing "${mention}" with "${agentMentionFormat}" (from "${agent.name}")`
          );

          if (agentMentionFormat === mention.toLowerCase()) {
            console.log(`   ✅ EXACT MATCH found!`);
            return true;
          }

          // Check if agent name contains the mention
          if (agent.name.toLowerCase().includes(mention.toLowerCase())) {
            console.log(`   ✅ PARTIAL MATCH found!`);
            return true;
          }

          // Check agent ID
          if (agent.id.toLowerCase() === mention.toLowerCase()) {
            console.log(`   ✅ ID MATCH found!`);
            return true;
          }

          console.log(`   ❌ No match`);
          return false;
        });

        if (mentionedAgent) {
          console.log(
            `🎯 SUCCESS: Using mentioned agent: ${mentionedAgent.name}`
          );
          return mentionedAgent;
        }
      }

      console.log(
        `⚠️ NO MATCH: Mentioned agent(s) not found: ${parsedMessage.mentionedAgents.join(
          ", "
        )}`
      );
      console.log(`⚠️ Falling back to intelligent routing...`);
    }

    // Otherwise, use intelligent routing
    return this.intelligentRouting(
      parsedMessage.cleanQuery,
      agents,
      chatHistory
    );
  }

  // AI-powered agent routing
  async intelligentRouting(
    query: string,
    agents: UserAgent[],
    chatHistory: ChatMessage[]
  ): Promise<UserAgent> {
    // Simple keyword-based routing (you could enhance this with AI)
    const queryLower = query.toLowerCase();

    const agentScores = agents.map((agent) => {
      const score = agent.expertise.reduce((total, keyword) => {
        return total + (queryLower.includes(keyword) ? 1 : 0);
      }, 0);

      // Boost score if recently used agent for context continuity
      const lastAgentUsed = chatHistory[chatHistory.length - 1]?.agent_used;
      if (lastAgentUsed === agent.name) {
        return { agent, score: score + 0.5 };
      }

      return { agent, score };
    });

    // Return best agent or default to first one
    const bestMatch = agentScores.sort((a, b) => b.score - a.score)[0];
    return bestMatch.score > 0 ? bestMatch.agent : agents[0];
  }

  // Search using agent's configuration
  async searchWithAgent(query: string, embedding: number[], agent: UserAgent) {
    const config = agent.search_config;

    // Apply time filtering based on agent's preference
    let dateFilter = null;
    if (config.time_preference === "recent") {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);
      dateFilter = recentDate.toISOString();
    }

    try {
      const { data, error } = await supabase.rpc("match_memories_enhanced", {
        query_embedding: embedding,
        match_threshold: config.threshold,
        match_count: 10,
        filter_category:
          config.categories.length > 0 ? config.categories[0] : null,
        filter_memory_type: null,
        date_from: dateFilter,
        date_to: null,
      });

      return data || [];
    } catch (error) {
      console.error("Agent search error:", error);
      return [];
    }
  }

  // Generate response with agent personality
  async generateResponse(
    query: string,
    memories: any[],
    agent: UserAgent,
    chatHistory: ChatMessage[]
  ) {
    // Build context from memories
    const memoryContext = memories
      .map(
        (memory) =>
          `**${memory.title}** (${new Date(
            memory.created_at
          ).toLocaleDateString()})\n${memory.content.substring(0, 200)}...`
      )
      .join("\n\n");

    // Build chat context
    const chatContext = chatHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const completion = await groq.chat.completions.create({
      model: agent.model,
      messages: [
        {
          role: "system",
          content: `${agent.system_prompt}

Your name is ${agent.name}. ${agent.description}

Recent conversation context:
${chatContext}

User's memories:
${memoryContext}

Instructions:
- Stay in character as ${agent.name}
- Reference specific memories when relevant
- Provide actionable insights based on your expertise
- If asked for summaries or next steps, be comprehensive and organized`,
        },
        { role: "user", content: query },
      ],
      max_tokens: 700,
      temperature: 0.5,
    });

    return {
      content: completion.choices[0]?.message?.content || "",
      agent_personality: agent.name,
    };
  }
}
