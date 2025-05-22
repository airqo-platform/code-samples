import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to import these modules on the client-side
      config.resolve.fallback = {
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
        http2: false,
      }
    }
    return config
  },
}

export default nextConfig
