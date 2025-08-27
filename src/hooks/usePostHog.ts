// src/hooks/usePostHog.ts
import { usePostHog } from 'posthog-js/react'
import { analytics } from '@/lib/analytics'

export function useAnalytics() {
  const posthog = usePostHog()

  return {
    // Direct PostHog access
    posthog,
    
    trackMemoryCreated: analytics.trackMemoryCreated,
    trackSearchPerformed: analytics.trackSearchPerformed,
    trackAIMessage: analytics.trackAIMessage,
    track: analytics.track,
    identify: analytics.identify,
    setUserProperties: analytics.setUserProperties,
    
    // Helper to check if PostHog is loaded
    isLoaded: () => posthog && typeof posthog.capture === 'function',
  }
}