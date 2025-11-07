/** @type {import('next').NextConfig} */
if (typeof process !== 'undefined') {
  process.noDeprecation = true
}

if (typeof process !== 'undefined' && process.emitWarning) {
  const originalEmitWarning = process.emitWarning.bind(process)
  process.emitWarning = (warning, ...args) => {
    const message = typeof warning === 'string' ? warning : warning?.message
    if (message && message.includes('punycode')) {
      return
    }
    return originalEmitWarning(warning, ...args)
  }
}

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  experimental: {
    optimizePackageImports: ['@/components/ui', 'lucide-react'],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig

