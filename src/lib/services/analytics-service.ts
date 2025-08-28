// lib/services/analytics-service.ts
import { posthog } from '@/lib/api/clients';
import { CreateMemoryInput } from '@/lib/api/validation-utils';


export class AnalyticsService {
 static async trackMemoryCreated(input: CreateMemoryInput & { memory: any }) {
   posthog.capture({
     distinctId: input.user_id || 'anonymous',
     event: 'memory_created',
     properties: {
       category: input.category || "Research",
       memory_type: input.memory_type || "Note",
       has_tags: !!(input.tags && Array.isArray(input.tags) ? input.tags.length > 0 : input.tags),
       tags_count: Array.isArray(input.tags) ? input.tags.length : 0,
       has_embedding: !!input.embedding,
       has_source_url: !!input.source_url,
       content_length: input.content.length,
       title_length: input.title.length,
       timestamp: new Date().toISOString(),
     }
   });
 }

 static async trackMemoryCreationFailed(error: any) {
   posthog.capture({
     distinctId: 'anonymous',
     event: 'memory_creation_failed',
     properties: {
       error_message: error.message,
       error_type: error.name,
       timestamp: new Date().toISOString(),
     }
   });
 }

 static async trackAIMessage(params: {
   user_id?: string;
   session_id?: string;
   message: string;
   result: any;
   startTime: number;
   embedding?: any;
   chat_history: any[];
 }) {
   posthog.capture({
     distinctId: params.user_id || params.session_id || 'anonymous',
     event: 'ai_message',
     properties: {
       agent_used: params.result.agent_used,
       message_length: params.message.length,
       response_length: params.result.response.length,
       has_sources: !!(params.result.sources && params.result.sources.length > 0),
       sources_count: params.result.sources ? params.result.sources.length : 0,
       memory_count: params.result.memory_count || 0,
       search_performed: params.result.search_performed || false,
       session_id: params.session_id,
       response_time_ms: Date.now() - params.startTime,
       has_embedding: !!params.embedding,
       chat_history_length: params.chat_history.length,
       timestamp: new Date().toISOString(),
     }
   });
 }

 static async trackAIMessageFailed(error: any, startTime: number) {
   posthog.capture({
     distinctId: 'anonymous',
     event: 'ai_message_failed',
     properties: {
       error_message: String(error),
       response_time_ms: Date.now() - startTime,
       timestamp: new Date().toISOString(),
     }
   });
 }

 static async trackSearchPerformed(params: {
   user_id?: string;
   query?: string;
   exclude_ids: string[];
   resultsCount: number;
   searchType: 'semantic' | 'text';
   hasEmbedding: boolean;
   startTime: number;
   limit: number;
 }) {
   posthog.capture({
     distinctId: params.user_id || 'anonymous',
     event: 'search_performed',
     properties: {
       query_length: params.query ? params.query.length : 0,
       filters_used: params.exclude_ids.length > 0 ? ['exclude_ids'] : [],
       results_count: params.resultsCount,
       search_type: params.searchType,
       has_embedding: params.hasEmbedding,
       response_time_ms: Date.now() - params.startTime,
       limit_requested: params.limit,
       timestamp: new Date().toISOString(),
     }
   });
 }

 static async trackSearchFailed(searchType: string, error: any, startTime: number) {
   posthog.capture({
     distinctId: 'anonymous',
     event: 'search_failed',
     properties: {
       error_message: error.message,
       search_type: searchType,
       response_time_ms: Date.now() - startTime,
       timestamp: new Date().toISOString(),
     }
   });
 }

 static async shutdown() {
   await posthog.shutdown();
 }
}