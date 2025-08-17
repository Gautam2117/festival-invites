/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optional: keep builds green even if ESLint finds nits.
  eslint: { ignoreDuringBuilds: true },

  // ✅ Keep these libs external in the server bundle (Vercel/Next 15)
  serverExternalPackages: [
    "@aws-sdk/client-s3",
    "@aws-sdk/lib-storage",
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/media-parser",
  ],

  webpack: (config: { externals: any[]; }, { isServer }: any) => {
    if (isServer) {
      // Extra safety: mark as externals in webpack too
      const externals = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [
        ...externals,
        "@remotion/bundler",
        "@remotion/renderer",
        "@remotion/media-parser",
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
