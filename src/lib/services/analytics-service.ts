// lib/services/analytics-service.ts
import { CreateMemoryInput } from '@/lib/api/validation-utils';

// Server-side analytics interface
interface AnalyticsEvent {
  distinctId: string;
  event: string;
  properties: Record<string, any>;
}

// Secure analytics logger that doesn't expose sensitive data
class SecureAnalytics {
  private static shouldTrack(): boolean {
    return process.env.NODE_ENV === 'production' && !!process.env.POSTHOG_API_KEY;
  }

  private static async capture(event: AnalyticsEvent): Promise<void> {
    if (!this.shouldTrack()) {
      // In development, just log to console
      console.log('Analytics Event:', event);
      return;
    }

    try {
      // Only import PostHog when needed in production
      const { PostHog } = await import('posthog-node');
      const posthog = new PostHog(
        process.env.POSTHOG_API_KEY!,
        { host: process.env.POSTHOG_HOST || 'https://app.posthog.com' }
      );

      posthog.capture(event);
      await posthog.shutdown();
    } catch (error) {
      console.error('Analytics capture failed:', error);
    }
  }

  // Sanitize user ID to prevent data leaks
  private static sanitizeUserId(userId?: string): string {
    if (!userId) return 'anonymous';
    // Hash or truncate user ID for privacy
    return userId.substring(0, 8) + '...';
  }

  // Sanitize content to prevent sensitive data leaks
  private static sanitizeContent(content: string): { length: number; hasContent: boolean } {
    return {
      length: content.length,
      hasContent: content.length > 0
    };
  }

  static async track(event: string, properties: Record<string, any>, userId?: string): Promise<void> {
    const sanitizedEvent: AnalyticsEvent = {
      distinctId: this.sanitizeUserId(userId),
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }
    };

    await this.capture(sanitizedEvent);
  }
}

export class AnalyticsService {
  // Memory creation tracking
  static async trackMemoryCreated(input: CreateMemoryInput & { memory: any; user_id: string }): Promise<void> {
    const contentInfo = SecureAnalytics['sanitizeContent'](input.content);
    const titleInfo = SecureAnalytics['sanitizeContent'](input.title);

    await SecureAnalytics.track('memory_created', {
      category: input.category || "Research",
      memory_type: input.memory_type || "Note",
      has_tags: !!(input.tags && Array.isArray(input.tags) ? input.tags.length > 0 : input.tags),
      tags_count: Array.isArray(input.tags) ? input.tags.length : 0,
      has_embedding: !!input.embedding,
      has_source_url: !!input.source_url,
      content_length: contentInfo.length,
      title_length: titleInfo.length,
      has_content: contentInfo.hasContent,
    }, input.user_id);
  }

  static async trackMemoryCreationFailed(error: { message?: string; user_id?: string }): Promise<void> {
    await SecureAnalytics.track('memory_creation_failed', {
      error_type: error.message ? 'validation' : 'unknown',
      has_error_message: !!error.message,
    }, error.user_id);
  }

  // AI message tracking
  static async trackAIMessage(params: {
    user_id: string;
    session_id?: string;
    message: string;
    result: any;
    startTime: number;
    embedding?: any;
    chat_history: any[];
  }): Promise<void> {
    const messageInfo = SecureAnalytics['sanitizeContent'](params.message);
    const responseInfo = SecureAnalytics['sanitizeContent'](params.result.response || '');

    await SecureAnalytics.track('ai_message', {
      agent_used: params.result.agent_used || 'default',
      message_length: messageInfo.length,
      response_length: responseInfo.length,
      has_sources: !!(params.result.sources && params.result.sources.length > 0),
      sources_count: params.result.sources ? params.result.sources.length : 0,
      memory_count: params.result.memory_count || 0,
      search_performed: params.result.search_performed || false,
      response_time_ms: Date.now() - params.startTime,
      has_embedding: !!params.embedding,
      chat_history_length: params.chat_history.length,
    }, params.user_id);
  }

  static async trackAIMessageFailed(error: any, startTime: number, userId?: string): Promise<void> {
    await SecureAnalytics.track('ai_message_failed', {
      error_type: typeof error,
      response_time_ms: Date.now() - startTime,
      has_error_message: !!error?.message,
    }, userId);
  }

  // Search tracking
  static async trackSearchPerformed(params: {
    user_id: string;
    query?: string;
    exclude_ids: string[];
    resultsCount: number;
    searchType: 'semantic' | 'text';
    hasEmbedding: boolean;
    startTime: number;
    limit: number;
  }): Promise<void> {
    await SecureAnalytics.track('search_performed', {
      query_length: params.query ? params.query.length : 0,
      has_query: !!params.query,
      filters_used: params.exclude_ids.length > 0 ? ['exclude_ids'] : [],
      results_count: params.resultsCount,
      search_type: params.searchType,
      has_embedding: params.hasEmbedding,
      response_time_ms: Date.now() - params.startTime,
      limit_requested: params.limit,
    }, params.user_id);
  }

  static async trackSearchFailed(searchType: string, error: any, startTime: number, userId?: string): Promise<void> {
    await SecureAnalytics.track('search_failed', {
      search_type: searchType,
      response_time_ms: Date.now() - startTime,
      error_type: typeof error,
      has_error_message: !!error?.message,
    }, userId);
  }

  // System events
  static async trackUserSignup(userId: string): Promise<void> {
    await SecureAnalytics.track('user_signup', {
      signup_method: 'email',
    }, userId);
  }

  static async trackUserLogin(userId: string): Promise<void> {
    await SecureAnalytics.track('user_login', {
      login_method: 'email',
    }, userId);
  }

  // No-op shutdown since we create PostHog instances per-call
  static async shutdown(): Promise<void> {
    // No persistent connection to shutdown
  }
}

// Optional: Client-side analytics bridge
export class ClientAnalyticsBridge {
  static trackMemoryCreated(properties: any): void {
    if (typeof window !== 'undefined') {
      // Use your existing client-side analytics
      import('@/lib/analytics').then(({ analytics }) => {
        analytics.trackMemoryCreated(properties);
      });
    }
  }

  static trackSearchPerformed(properties: any): void {
    if (typeof window !== 'undefined') {
      import('@/lib/analytics').then(({ analytics }) => {
        analytics.trackSearchPerformed(properties);
      });
    }
  }

  static trackAIMessage(properties: any): void {
    if (typeof window !== 'undefined') {
      import('@/lib/analytics').then(({ analytics }) => {
        analytics.trackAIMessage(properties);
      });
    }
  }
}