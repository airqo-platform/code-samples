import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { canEditContent } from "@/lib/auth"
import { getCollection } from "@/lib/mongodb"

// GET handler to retrieve all features
export async function GET(request: Request) {
  try {
    // Get query parameters for filtering
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const search = url.searchParams.get("search")

    // Build query
    const query: Record<string, any> = {}

    if (status) {
      query.status = status
    }

    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Get features from MongoDB
    const featuresCollection = await getCollection("features")
    const features = await featuresCollection.find(query).toArray()

    return NextResponse.json({ features })
  } catch (error) {
    console.error("Error fetching features:", error)
    return NextResponse.json({ error: "Failed to fetch features" }, { status: 500 })
  }
}

// POST handler to create a new feature
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

    // Check if user has permission to create features
    if (!canEditContent(userData)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Parse the request body
    const featureData = await request.json()

    // Validate required fields
    if (!featureData.title || !featureData.slug) {
      return NextResponse.json({ error: "Title and slug are required" }, { status: 400 })
    }

    // Add timestamps
    const now = new Date().toISOString()
    featureData.createdAt = now
    featureData.updatedAt = now

    // Save to MongoDB
    const featuresCollection = await getCollection("features")

    // Check if slug already exists
    const existingFeature = await featuresCollection.findOne({ slug: featureData.slug })
    if (existingFeature) {
      return NextResponse.json({ error: "A feature with this slug already exists" }, { status: 400 })
    }

    const result = await featuresCollection.insertOne(featureData)

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      feature: { ...featureData, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Error creating feature:", error)
    return NextResponse.json({ error: "Failed to create feature" }, { status: 500 })
  }
}

