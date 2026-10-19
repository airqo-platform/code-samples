import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  outputFileTracingIncludes: {
    "/website-map-integration": ["./src/embed/map.html"],
  },
  async headers() {
    // Standalone file:// test pages have opaque origins, which cannot match
    // frame-ancestors *. Permit those test pages only during local development.
    if (process.env.NODE_ENV === "development") return []
    return ["/website-map-integration/:path*", "/billboard/:path*"].map(source => ({
      source,
      headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self' http: https:" }],
    }))
  },
}

export default nextConfig
