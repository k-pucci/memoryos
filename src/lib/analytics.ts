//src/lib/analytics.ts

import posthog from 'posthog-js'

// Type definitions for your events
export interface MemoryCreatedEvent {
  category: string
  memory_type: string
  has_tags: boolean
  tags_count?: number
  has_embedding?: boolean
  has_summary?: boolean
  source_url?: string
}

export interface SearchPerformedEvent {
  query_length: number
  filters_used: string[]
  results_count: number
  search_type: 'semantic' | 'text'
  has_embedding: boolean
}

export interface AIMessageEvent {
  agent_used: string
  message_length: number
  has_sources: boolean
  sources_count?: number
  memory_count?: number
  session_id?: string
}

// Analytics utility functions
export const analytics = {
  // Track memory creation
  trackMemoryCreated: (properties: MemoryCreatedEvent) => {
    if (typeof window !== 'undefined') {
      posthog.capture('memory_created', {
        ...properties,
        timestamp: new Date().toISOString(),
      })
    }
  },

  // Track search performed
  trackSearchPerformed: (properties: SearchPerformedEvent) => {
    if (typeof window !== 'undefined') {
      posthog.capture('search_performed', {
        ...properties,
        timestamp: new Date().toISOString(),
      })
    }
  },

  // Track AI messages
  trackAIMessage: (properties: AIMessageEvent) => {
    if (typeof window !== 'undefined') {
      posthog.capture('ai_message', {
        ...properties,
        timestamp: new Date().toISOString(),
      })
    }
  },

  // Generic event tracking
  track: (event: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.capture(event, {
        ...properties,
        timestamp: new Date().toISOString(),
      })
    }
  },

  // Identify user (call when user logs in or signs up)
  identify: (userId: string, userProperties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, userProperties)
    }
  },

  // Set user properties
  setUserProperties: (properties: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.people.set(properties)
    }
  }
}
