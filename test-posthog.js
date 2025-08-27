// test-posthog.js
const { PostHog } = require('posthog-node')

const posthog = new PostHog(
  'phc_GwLkze2CAtc2eEpkGxSUeA76qAkQHszF7pSHMTHwFu6', // your key
  { host: 'https://us.i.posthog.com' }
)

console.log('Testing PostHog...')

posthog.capture({
  distinctId: 'test-user-123',
  event: 'test_event',
  properties: {
    test_property: 'hello world',
    timestamp: new Date().toISOString(),
  }
})

console.log('Event sent!')

// Wait a moment then shutdown
setTimeout(async () => {
  await posthog.shutdown()
  console.log('PostHog shutdown complete')
  process.exit(0)
}, 2000)