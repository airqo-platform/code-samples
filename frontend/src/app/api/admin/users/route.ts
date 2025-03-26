import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { canManageUsers } from "@/lib/auth"
import { getCollection } from "@/lib/mongodb"

// GET handler to retrieve all users
export async function GET(request: Request) {
  try {
    // Check authentication and permissions
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse user data from session
    const userData = JSON.parse(sessionCookie.value)

    // Check if user has permission to manage users
    if (!canManageUsers(userData)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Get query parameters for filtering
    const url = new URL(request.url)
    const role = url.searchParams.get("role")
    const status = url.searchParams.get("status")
    const search = url.searchParams.get("search")

    // Build query
    const query: Record<string, any> = {}

    if (role) {
      query.role = role
    }

    if (status) {
      query.isActive = status === "active"
    }

    if (search) {
      query.$or = [{ username: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
    }

    // Get users from MongoDB
    const usersCollection = await getCollection("users")
    const users = await usersCollection.find(query).toArray()

    // Remove sensitive information like password hashes
    const safeUsers = users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = user
      return safeUser
    })

    return NextResponse.json({ users: safeUsers })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

// POST handler to create a new user
export async function POST(request: Request) {
  try {
    // Check authentication and permissions
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse user data from session
    const userData = JSON.parse(sessionCookie.value)

    // Check if user has permission to manage users
    if (!canManageUsers(userData)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Parse the request body
    const newUserData = await request.json()

    // Validate required fields
    if (!newUserData.username || !newUserData.email || !newUserData.password) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 })
    }

    // Get users collection
    const usersCollection = await getCollection("users")

    // Check if username or email already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ username: newUserData.username }, { email: newUserData.email }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 })
    }

    // In a real implementation, you would hash the password here
    // For now, we'll just store it as is (NOT SECURE - DEMO ONLY)

    // Add timestamps and default values
    const now = new Date().toISOString()
    const userToInsert = {
      ...newUserData,
      isActive: newUserData.isActive !== false, // Default to active if not specified
      createdAt: now,
      updatedAt: now,
      lastLogin: null,
    }

    // Insert the new user
    const result = await usersCollection.insertOne(userToInsert)

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = userToInsert

    return NextResponse.json({
      success: true,
      user: { ...safeUser, id: result.insertedId.toString() },
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

