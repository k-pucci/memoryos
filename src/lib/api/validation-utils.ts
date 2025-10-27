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
  user_id?: string; // Will be set by API route, not from user input
}

export interface UpdateMemoryInput {
  title: string;
  content: string;
  category?: string;
  memory_type?: string;
  tags?: string | string[];
  has_reminder?: boolean;
  source_url?: string;
  embedding?: number[];
  // Note: user_id not included - can't be changed in updates
}

export interface ChatInput {
  message: string;
  embedding?: any;
  chat_history: any[];
  session_id?: string;
  user_id?: string; // Will be set by API route
}

export interface SearchInput {
  query?: string;
  limit?: number;
  exclude_ids?: string[];
  embedding?: number[];
  user_id?: string; // Will be set by API route
  threshold?: number;
}

export interface EmbeddingInput {
  text: string;
}

export const validateCreateMemory = (data: any): CreateMemoryInput => {
  // Validate required fields
  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    throw new Error("Title is required and must be a non-empty string");
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim() === '') {
    throw new Error("Content is required and must be a non-empty string");
  }

  // Validate optional fields
  const validMemoryTypes = ['Note', 'Meeting', 'Idea', 'Task', 'Research', 'Learning'];
  if (data.memory_type && !validMemoryTypes.includes(data.memory_type)) {
    throw new Error(`Memory type must be one of: ${validMemoryTypes.join(', ')}`);
  }

  const validCategories = ['Research', 'Product', 'Meeting', 'Learning', 'Idea', 'Task'];
  if (data.category && !validCategories.includes(data.category)) {
    throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
  }

  // Sanitize and validate tags
  if (data.tags) {
    if (typeof data.tags === 'string') {
      data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    } else if (!Array.isArray(data.tags)) {
      throw new Error("Tags must be a string or array of strings");
    }
  }

  // Validate URL if provided
  if (data.source_url) {
    try {
      new URL(data.source_url);
    } catch {
      throw new Error("Source URL must be a valid URL");
    }
  }

  // Remove user_id from input if it exists (security: will be set by API route)
  const { user_id, ...sanitizedData } = data;

  return {
    title: data.title.trim(),
    content: data.content.trim(),
    category: data.category || 'Research',
    memory_type: data.memory_type || 'Note',
    tags: data.tags || [],
    has_reminder: Boolean(data.has_reminder),
    source_url: data.source_url || null,
    embedding: Array.isArray(data.embedding) ? data.embedding : undefined,
  };
};

export const validateUpdateMemory = (data: any): UpdateMemoryInput => {
  // Validate required fields
  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    throw new Error("Title is required and must be a non-empty string");
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim() === '') {
    throw new Error("Content is required and must be a non-empty string");
  }

  // Validate optional fields if provided
  const validMemoryTypes = ['Note', 'Meeting', 'Idea', 'Task', 'Research', 'Learning'];
  if (data.memory_type && !validMemoryTypes.includes(data.memory_type)) {
    throw new Error(`Memory type must be one of: ${validMemoryTypes.join(', ')}`);
  }

  const validCategories = ['Research', 'Product', 'Meeting', 'Learning', 'Idea', 'Task'];
  if (data.category && !validCategories.includes(data.category)) {
    throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
  }

  // Sanitize tags
  if (data.tags) {
    if (typeof data.tags === 'string') {
      data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    } else if (!Array.isArray(data.tags)) {
      throw new Error("Tags must be a string or array of strings");
    }
  }

  // Validate URL if provided
  if (data.source_url) {
    try {
      new URL(data.source_url);
    } catch {
      throw new Error("Source URL must be a valid URL");
    }
  }

  // Remove user_id from input if it exists (security: can't be changed in updates)
  const { user_id, ...sanitizedData } = data;

  return {
    title: data.title.trim(),
    content: data.content.trim(),
    ...(data.category && { category: data.category }),
    ...(data.memory_type && { memory_type: data.memory_type }),
    ...(data.tags && { tags: data.tags }),
    ...(data.has_reminder !== undefined && { has_reminder: Boolean(data.has_reminder) }),
    ...(data.source_url !== undefined && { source_url: data.source_url }),
    ...(Array.isArray(data.embedding) && { embedding: data.embedding }),
  };
};

export const validateChatInput = (data: any): ChatInput => {
  if (!data.message || typeof data.message !== 'string' || data.message.trim() === '') {
    throw new Error("Message is required and must be a non-empty string");
  }

  // Validate chat history format
  if (data.chat_history && !Array.isArray(data.chat_history)) {
    throw new Error("Chat history must be an array");
  }

  // Remove user_id from input if it exists (will be set by API route)
  const { user_id, ...sanitizedData } = data;

  return {
    message: data.message.trim(),
    embedding: data.embedding,
    chat_history: data.chat_history || [],
    session_id: data.session_id,
  };
};

export const validateSearchInput = (data: any): SearchInput => {
  const validated: SearchInput = {
    query: data.query ? String(data.query).trim() : undefined,
    limit: Math.min(Math.max(parseInt(data.limit) || 10, 1), 100), // Between 1-100
    exclude_ids: Array.isArray(data.exclude_ids) ? data.exclude_ids : [],
    embedding: Array.isArray(data.embedding) ? data.embedding : undefined,
    threshold: Math.min(Math.max(parseFloat(data.threshold) || 0.7, 0), 1), // Between 0-1
  };

  // Remove user_id from input if it exists (will be set by API route)
  const { user_id, ...sanitizedData } = data;

  return validated;
};

export const validateEmbeddingInput = (data: any): EmbeddingInput => {
  if (!data.text || typeof data.text !== 'string' || data.text.trim() === '') {
    throw new Error("Text is required and must be a non-empty string");
  }
  
  return {
    text: data.text.trim()
  };
};