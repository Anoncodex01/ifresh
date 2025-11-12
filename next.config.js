/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Image optimization - set to false if using external image URLs
  images: { 
    unoptimized: true,
    // If using cloud storage (S3, Cloudinary), add domains:
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: '**.amazonaws.com',
    //   },
    //   {
    //     protocol: 'https',
    //     hostname: 'res.cloudinary.com',
    //   },
    // ],
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  // Server Actions (enabled by default in Next.js 13.5+)
  experimental: {
    serverActions: true,
  },
  // Make optional dependencies external (won't cause build errors if not installed)
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark optional packages as external for server-side
      // These will be resolved at runtime, not build time
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push({
          'pdfkit': 'commonjs pdfkit',
          '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
        });
      } else {
        config.externals = [
          config.externals,
          {
            'pdfkit': 'commonjs pdfkit',
            '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
          }
        ];
      }
    }
    return config;
  },
};

module.exports = nextConfig;
