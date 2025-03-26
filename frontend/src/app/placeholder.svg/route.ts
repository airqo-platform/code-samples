import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Get query parameters
  const url = new URL(request.url)
  const width = Number.parseInt(url.searchParams.get("width") || "400", 10)
  const height = Number.parseInt(url.searchParams.get("height") || "300", 10)
  const text = url.searchParams.get("text") || "Placeholder Image"
  const bgColor = url.searchParams.get("bgColor") || "#f0f0f0"
  const textColor = url.searchParams.get("textColor") || "#888888"

  // Create SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="16" 
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >
        ${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
      </text>
    </svg>
  `

  // Return SVG with appropriate headers
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}

