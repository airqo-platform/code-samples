import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { canEditContent, canDeleteContent } from "@/lib/auth"
import { getCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// GET handler to retrieve a specific feature by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Get feature from MongoDB
    const featuresCollection = await getCollection("features")

    let feature
    // Check if id is a valid ObjectId
    if (ObjectId.isValid(id)) {
      feature = await featuresCollection.findOne({ _id: new ObjectId(id) })
    } else {
      // If not a valid ObjectId, try to find by slug
      feature = await featuresCollection.findOne({ slug: id })
    }

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 })
    }

    return NextResponse.json(feature)
  } catch (error) {
    console.error("Error fetching feature:", error)
    return NextResponse.json({ error: "Failed to fetch feature" }, { status: 500 })
  }
}

// PUT handler to update a specific feature by ID
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

    // Check if user has permission to edit features
    if (!canEditContent(userData)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const id = params.id

    // Parse the request body
    const featureData = await request.json()

    // Validate required fields
    if (!featureData.title || !featureData.slug) {
      return NextResponse.json({ error: "Title and slug are required" }, { status: 400 })
    }

    // Update timestamp
    featureData.updatedAt = new Date().toISOString()

    // Update in MongoDB
    const featuresCollection = await getCollection("features")

    // Check if slug already exists for a different feature
    if (featureData.slug) {
      const existingFeature = await featuresCollection.findOne({
        slug: featureData.slug,
        _id: { $ne: new ObjectId(id) },
      })

      if (existingFeature) {
        return NextResponse.json({ error: "A different feature with this slug already exists" }, { status: 400 })
      }
    }

    const result = await featuresCollection.updateOne({ _id: new ObjectId(id) }, { $set: featureData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      feature: { ...featureData, _id: id },
    })
  } catch (error) {
    console.error("Error updating feature:", error)
    return NextResponse.json({ error: "Failed to update feature" }, { status: 500 })
  }
}

// DELETE handler to remove a specific feature by ID
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

    // Check if user has permission to delete features
    if (!canDeleteContent(userData)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const id = params.id

    // Delete from MongoDB
    const featuresCollection = await getCollection("features")
    const result = await featuresCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting feature:", error)
    return NextResponse.json({ error: "Failed to delete feature" }, { status: 500 })
  }
}

