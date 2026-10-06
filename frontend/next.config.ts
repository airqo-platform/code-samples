import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  outputFileTracingIncludes: {
    "/website-map-integration": ["./src/embed/map.html"],
  },
  async headers() {
    return [{
      source: "/website-map-integration/:path*",
      headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }],
    }]
  },
}

export default nextConfig
