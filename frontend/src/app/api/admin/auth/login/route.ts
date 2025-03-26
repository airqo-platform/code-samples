import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// In a real application, you would use a database and proper authentication
// This is a simplified example for demonstration purposes
const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "password123"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Set a cookie to indicate the user is logged in
      // In a real app, you would use a proper JWT or session token
      cookies().set("admin_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ message: "Invalid username or password" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "An error occurred during login" }, { status: 500 })
  }
}

