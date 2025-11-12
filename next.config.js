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
  // Ensure proper runtime for API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
