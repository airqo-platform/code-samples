import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// In a real application, you would use a database and proper authentication
// This is a simplified example for demonstration purposes
const USERS = {
  admin: {
    password: "password123",
    role: "admin",
    id: "1",
    email: "admin@example.com",
  },
  editor: {
    password: "editor123",
    role: "editor",
    id: "2",
    email: "editor@example.com",
  },
  viewer: {
    password: "viewer123",
    role: "viewer",
    id: "3",
    email: "viewer@example.com",
  },
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    const user = USERS[username as keyof typeof USERS]

    if (user && user.password === password) {
      // Set a cookie to indicate the user is logged in
      // In a real app, you would use a proper JWT or session token
      const userData = {
        id: user.id,
        username,
        email: user.email,
        role: user.role,
        isActive: true,
      }

      const userSession = JSON.stringify(userData)

      const cookieStore = await cookies()
      cookieStore.set("admin_session", userSession, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      })

      return NextResponse.json({ success: true, user: userData })
    }

    return NextResponse.json({ message: "Invalid username or password" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "An error occurred during login" }, { status: 500 })
  }
}

