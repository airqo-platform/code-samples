import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { canManageUsers } from "@/lib/auth"
import { getCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// GET handler to retrieve a specific user by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    const id = params.id

    // Get user from MongoDB
    const usersCollection = await getCollection("users")
    const user = await usersCollection.findOne({ _id: new ObjectId(id) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove sensitive information
    const { password, ...safeUser } = user

    return NextResponse.json(safeUser)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

// PUT handler to update a specific user by ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const id = params.id

    // Parse the request body
    const updateData = await request.json()

    // Validate required fields
    if (!updateData.username || !updateData.email) {
      return NextResponse.json({ error: "Username and email are required" }, { status: 400 })
    }

    // Get users collection
    const usersCollection = await getCollection("users")

    // Check if username or email already exists for a different user
    const existingUser = await usersCollection.findOne({
      $or: [{ username: updateData.username }, { email: updateData.email }],
      _id: { $ne: new ObjectId(id) },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists for another user" }, { status: 400 })
    }

    // Prepare update data
    const updateFields: Record<string, any> = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    }

    // If password is being updated and not empty
    if (updateData.password) {
      // In a real implementation, you would hash the password here
      // For now, we'll just store it as is (NOT SECURE - DEMO ONLY)
      updateFields.password = updateData.password
    } else {
      // Don't update password if not provided
      delete updateFields.password
    }

    // Update the user
    const result = await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateFields })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the updated user
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(id) })

    // Remove sensitive information
    const { password, ...safeUser } = updatedUser || {}

    return NextResponse.json({
      success: true,
      user: safeUser,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

// DELETE handler to remove a specific user by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    const id = params.id

    // Prevent deleting your own account
    if (userData.id === id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
    }

    // Delete from MongoDB
    const usersCollection = await getCollection("users")
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

