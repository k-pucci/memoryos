//src/components/providers/PostHogProvider.tsx

'use client'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Component that uses useSearchParams - needs to be wrapped in Suspense
function PostHogTracker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Only initialize client-side PostHog in production
    // Server-side tracking works in all environments
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: '/ingest',
        ui_host: 'https://us.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // We handle this manually
        capture_pageleave: true,
        session_recording: {
          maskAllInputs: false,
        },
        // Production optimizations
        loaded: (posthog) => {
          // Only log in development builds
          if (process.env.NODE_ENV === 'development') {
            console.log('PostHog loaded')
          }
        }
      })
    }
  }, [])

  useEffect(() => {
    if (pathname && typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
      
      // Check if PostHog is actually loaded before capturing
      if (posthog && typeof posthog.capture === 'function') {
        posthog.capture('$pageview', {
          $current_url: url,
          page: pathname,
        })
      }
    }
  }, [pathname, searchParams])

  return <PHProvider client={posthog}>{children}</PHProvider>
}

// Main provider component with Suspense boundary
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>{children}</div>}>
      <PostHogTracker>{children}</PostHogTracker>
    </Suspense>
  )
}

// Alternative: Create a mock PostHog for development
const mockPostHog = {
  capture: () => {},
  identify: () => {},
  isFeatureEnabled: () => false,
  getFeatureFlag: () => undefined,
} as any

// Export the appropriate client based on environment
export const getPostHogClient = () => {
  if (process.env.NODE_ENV === 'production') {
    return posthog
  }
  return mockPostHog
}
