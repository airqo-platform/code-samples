import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getCollection } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Get users collection
    const usersCollection = await getCollection("users")

    // Find user by username
    const user = await usersCollection.findOne({ username })

    // If no user found or password doesn't match
    // In a real implementation, you would use a proper password hashing library
    if (!user || user.password !== password) {
      // For demo purposes, check against hardcoded test accounts if not found in DB
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

      // Check against hardcoded test accounts
      const testUser = USERS[username as keyof typeof USERS]
      if (testUser && testUser.password === password) {
        // Set a cookie to indicate the user is logged in
        const userData = {
          id: testUser.id,
          username,
          email: testUser.email,
          role: testUser.role,
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

      // If we get here, authentication failed
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 })
    }

    // User found and password matches
    // Update last login time
    await usersCollection.updateOne({ _id: user._id }, { $set: { lastLogin: new Date().toISOString() } })

    // Create user session data (remove sensitive info)
    const { password: dbPassword, ...userData } = user

    const userSession = JSON.stringify({
      ...userData,
      id: user._id.toString(),
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("admin_session", userSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: {
        ...userData,
        id: user._id.toString(),
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "An error occurred during login" }, { status: 500 })
  }
}

