// /app/api/agents/user-agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for user data
);

export async function GET(request: NextRequest) {
  try {
    // TODO: Get actual user ID from auth
    // For now, get all custom agents since we're not filtering by user

    // Get user's custom agents (all active agents for now)
    const { data: customAgents, error: customError } = await supabase
      .from("user_agents")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (customError) {
      console.error("Error fetching custom agents:", customError);
    }

    // Transform custom agents to match expected format
    const transformedCustomAgents = (customAgents || []).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      expertise: agent.expertise || [],
      model: agent.model,
      avatar_url: agent.image_url, // Map image_url to avatar_url
      search_threshold: agent.search_threshold,
      search_categories: agent.search_categories || [],
      time_preference: agent.time_preference,
      system_prompt: agent.system_prompt,
    }));

    // Default agents (always available)
    const defaultAgents = [
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
        model: "llama3-8b-8192",
        avatar_url: null,
        search_threshold: 0.3,
        search_categories: ["Meeting", "Work"],
        time_preference: "recent",
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
        model: "llama3-70b-8192",
        avatar_url: null,
        search_threshold: 0.4,
        search_categories: ["Research", "Analysis"],
        time_preference: "all",
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
        model: "llama3-8b-8192",
        avatar_url: null,
        search_threshold: 0.25,
        search_categories: ["Idea", "Creative", "Project"],
        time_preference: "all",
      },
    ];

    // Combine custom and default agents
    const allAgents = [...defaultAgents, ...transformedCustomAgents];

    console.log(
      `✅ Found ${transformedCustomAgents.length} custom agents and ${defaultAgents.length} default agents`
    );

    return NextResponse.json({
      success: true,
      agents: allAgents,
      total: allAgents.length,
      custom_count: transformedCustomAgents.length,
    });
  } catch (error) {
    console.error("Error fetching user agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
