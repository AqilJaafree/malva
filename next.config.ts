import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable turbopack and use webpack
  turbopack: {},

  // Transpile packages for compatibility
  transpilePackages: ['@privy-io/react-auth'],

  webpack: (config, { isServer }) => {
    // Exclude test files from bundling
    config.resolve.alias = {
      ...config.resolve.alias,
      'thread-stream/test': false,
      'pino/test': false,
    };

    // Fallback for Node.js modules on client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    return config;
  },
};

export default nextConfig;
