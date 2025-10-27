// lib/services/memory-service.ts - Pure business logic with auth
import { supabaseAdmin } from '@/lib/supabase/admin';
import { AIService } from './ai-service';
import { CreateMemoryInput, UpdateMemoryInput } from '@/lib/api/validation-utils';

export class MemoryService {
  // Get memory by ID - requires user_id for security
  static async getMemory(id: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from("memories")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId) // Ensure user can only access their own memory
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error("Memory not found or access denied");
      }
      throw new Error(error.message);
    }

    return data;
  }

  static async createMemory(input: CreateMemoryInput & { user_id: string }) {
    const summary = await AIService.generateSummary(input.content);
    const finalEmbedding = AIService.validateEmbedding(input.embedding);

    // Process tags
    let parsedTags = input.tags;
    if (typeof input.tags === "string") {
      parsedTags = input.tags
        .split(",")
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag);
    }

    const { data, error } = await supabaseAdmin
      .from("memories")
      .insert([
        {
          user_id: input.user_id, // Associate with authenticated user
          title: input.title,
          category: input.category || "Research",
          memory_type: input.memory_type || "Note",
          content: input.content,
          summary,
          tags: parsedTags,
          has_reminder: input.has_reminder || false,
          source_url: input.source_url,
          embedding: finalEmbedding,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      memory: data[0],
      hasEmbedding: !!finalEmbedding,
      hasSummary: !!summary,
    };
  }

  static async updateMemory(id: string, input: UpdateMemoryInput, userId: string) {
    // First check if the memory exists and belongs to the user
    await this.getMemory(id, userId);

    const summary = await AIService.generateSummary(input.content);
    const finalEmbedding = AIService.validateEmbedding(input.embedding);

    const updateData: any = {
      title: input.title,
      category: input.category,
      memory_type: input.memory_type,
      content: input.content,
      summary,
      tags: input.tags,
      has_reminder: input.has_reminder,
      source_url: input.source_url,
      updated_at: new Date().toISOString(),
    };

    // Only update embedding if a new one was provided
    if (finalEmbedding) {
      updateData.embedding = finalEmbedding;
    }

    const { data, error } = await supabaseAdmin
      .from("memories")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId) // Ensure user can only update their own memory
      .select();

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error("Memory not found or access denied");
    }

    return {
      memory: data[0],
      hasSummary: !!summary,
      hasEmbedding: !!finalEmbedding,
    };
  }

  static async deleteMemory(id: string, userId: string) {
    // First check if the memory exists and belongs to the user
    await this.getMemory(id, userId);

    const { error } = await supabaseAdmin
      .from("memories")
      .delete()
      .eq("id", id)
      .eq("user_id", userId); // Ensure user can only delete their own memory

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, message: "Memory deleted successfully" };
  }

  static async getAllTags(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('memories')
      .select('tags')
      .eq('user_id', userId); // Only get tags from user's memories
          
    if (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }
        
    // Extract and flatten all tags from all rows
    const allTags = data
      .flatMap(row => row.tags || [])
      .filter(Boolean);
        
    // Get unique tags and sort them alphabetically
    const uniqueTags = [...new Set(allTags)].sort();
        
    return uniqueTags;
  }

  // New method: Get memories for a user with pagination and filtering
  static async getUserMemories(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      category?: string;
      search?: string;
      tags?: string[];
    } = {}
  ) {
    let query = supabaseAdmin
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.search) {
      query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
    }

    if (options.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch memories: ${error.message}`);
    }

    return data || [];
  }
}