// /app/api/agents/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Check if request is FormData or JSON
    const contentType = request.headers.get("content-type");
    let requestData;

    if (contentType?.includes("multipart/form-data")) {
      // Handle FormData (with potential image upload)
      const formData = await request.formData();

      requestData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        expertise: JSON.parse(formData.get("expertise") as string),
        system_prompt: formData.get("system_prompt") as string,
        model: (formData.get("model") as string) || "llama3-8b-8192",
        search_threshold:
          parseFloat(formData.get("search_threshold") as string) || 0.4,
        search_categories: JSON.parse(
          formData.get("search_categories") as string
        ),
        time_preference:
          (formData.get("time_preference") as string) || "recent",
        image: formData.get("image") as File | null,
      };
    } else {
      // Handle JSON (backward compatibility)
      requestData = await request.json();
    }

    const {
      name,
      description,
      expertise,
      system_prompt,
      model = "llama3-8b-8192",
      search_threshold = 0.4,
      search_categories = [],
      time_preference = "recent",
      image = null,
    } = requestData;

    // Validation
    if (!name || !description || !system_prompt) {
      return NextResponse.json(
        { error: "Name, description, and system prompt are required" },
        { status: 400 }
      );
    }

    if (!expertise || expertise.length === 0) {
      return NextResponse.json(
        { error: "At least one expertise keyword is required" },
        { status: 400 }
      );
    }

    // Handle image upload if present
    let imageUrl = null;
    if (image && image.size > 0) {
      try {
        // Convert image to base64 or upload to storage
        // For now, we'll create a simple placeholder
        // You can implement actual image upload later
        console.log("Image received:", image.name, image.size, image.type);

        // TODO: Implement image upload to Supabase Storage or other service
        // Example for Supabase Storage:
        /*
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('agent-avatars')
          .upload(filePath, image);
          
        if (!uploadError) {
          const { data } = supabase.storage
            .from('agent-avatars')
            .getPublicUrl(filePath);
          imageUrl = data.publicUrl;
        }
        */
      } catch (imageError) {
        console.error("Image upload error:", imageError);
        // Continue without image rather than failing
      }
    }

    // Create the agent data object
    const agentData: any = {
      name,
      description,
      expertise: Array.isArray(expertise)
        ? expertise
        : expertise.split(",").map((s: string) => s.trim()),
      system_prompt,
      model,
      search_threshold: parseFloat(search_threshold.toString()),
      search_categories: Array.isArray(search_categories)
        ? search_categories
        : search_categories.split(",").map((s: string) => s.trim()),
      time_preference,
      active: true,
    };

    // Add image_url only if we have one
    if (imageUrl) {
      agentData.image_url = imageUrl;
    }

    // TODO: Add created_by when you implement authentication
    // For now, skip created_by to avoid foreign key constraint issues

    // Create the agent
    const { data, error } = await supabase
      .from("user_agents")
      .insert([agentData])
      .select();

    if (error) {
      console.error("Error creating agent:", error);
      return NextResponse.json(
        { error: "Failed to create agent", details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Agent created successfully:", data[0]);

    return NextResponse.json({
      success: true,
      agent: data[0],
      message: "Agent created successfully",
    });
  } catch (error) {
    console.error("Error in create agent API:", error);
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
