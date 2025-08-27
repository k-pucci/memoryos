// lib/services/memory-service.ts - Pure business logic
import { supabase } from '@/lib/api/clients';
import { AIService } from './ai-service';
import { CreateMemoryInput, UpdateMemoryInput } from '@/lib/api/validation-utils';

export class MemoryService {
  static async getMemory(id: string) {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async createMemory(input: CreateMemoryInput) {
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

    const { data, error } = await supabase
      .from("memories")
      .insert([
        {
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

  static async updateMemory(id: string, input: UpdateMemoryInput) {
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

    const { data, error } = await supabase
      .from("memories")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return {
      memory: data[0],
      hasSummary: !!summary,
      hasEmbedding: !!finalEmbedding,
    };
  }

  static async deleteMemory(id: string) {
    const { error } = await supabase.from("memories").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, message: "Memory deleted successfully" };
  }

  static async getAllTags() {
    const { data, error } = await supabase
      .from('memories')
      .select('tags');
          
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
}