// lib/api/validation-utils.ts
export interface CreateMemoryInput {
    title: string;
    content: string;
    category?: string;
    memory_type?: string;
    tags?: string | string[];
    has_reminder?: boolean;
    source_url?: string;
    embedding?: number[];
    user_id?: string;
  }
  
  export interface UpdateMemoryInput extends Partial<CreateMemoryInput> {
    title: string;
    content: string;
  }
  
  export interface ChatInput {
    message: string;
    embedding?: any;
    chat_history: any[];
    session_id?: string;
    user_id?: string;
  }
  
  export interface SearchInput {
    query?: string;
    limit?: number;
    exclude_ids?: string[];
    embedding?: number[];
    user_id?: string;
    threshold?: number;
  }
  
  export interface EmbeddingInput {
    text: string;
  }
  
  export const validateCreateMemory = (data: any): CreateMemoryInput => {
    if (!data.title || !data.content) {
      throw new Error("Title and content are required");
    }
    return data;
  };
  
  export const validateUpdateMemory = (data: any): UpdateMemoryInput => {
    if (!data.title || !data.content) {
      throw new Error("Title and content are required");
    }
    return data;
  };
  
  export const validateChatInput = (data: any): ChatInput => {
    if (!data.message || data.message.trim() === "") {
      throw new Error("Message is required");
    }
    return {
      ...data,
      chat_history: data.chat_history || []
    };
  };
  
  export const validateSearchInput = (data: any): SearchInput => {
    return {
      query: data.query,
      limit: data.limit || 10,
      exclude_ids: data.exclude_ids || [],
      embedding: data.embedding,
      user_id: data.user_id,
      threshold: data.threshold || 0.7
    };
  };
  
  export const validateEmbeddingInput = (data: any): EmbeddingInput => {
    if (!data.text) {
      throw new Error("Text is required");
    }
    return data;
  };