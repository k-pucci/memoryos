/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
      return [
          {
              source: '/ingest/static/:path*',
              destination: 'https://us-assets.i.posthog.com/static/:path*',
          },
          {
              source: '/ingest/:path*',
              destination: 'https://us.i.posthog.com/:path*',
          },
      ]
  },
}

module.exports = nextConfig