/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/lib-storage'],
};

module.exports = nextConfig;
