import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { canEditContent } from "@/lib/auth"
import { getCollection } from "@/lib/mongodb"
import { deleteImage } from "@/lib/cloudinary"
import { ObjectId } from "mongodb"

// GET handler to retrieve all media items
export async function GET(request: Request) {
  try {
    // Get query parameters for filtering
    const url = new URL(request.url)
    const type = url.searchParams.get("type")
    const search = url.searchParams.get("search")

    // Build query
    const query: Record<string, any> = {}

    if (type) {
      query.type = { $regex: `^${type}`, $options: "i" }
    }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }]
    }

    // Get media items from MongoDB
    const mediaCollection = await getCollection("media")
    const items = await mediaCollection.find(query).sort({ uploadedAt: -1 }).toArray()

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Error fetching media:", error)
    return NextResponse.json({ error: "Failed to fetch media items" }, { status: 500 })
  }
}

// DELETE handler to remove a media item
export async function DELETE(request: Request) {
  try {
    // Check authentication and permissions
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse user data from session
    const userData = JSON.parse(sessionCookie.value)

    // Check if user has permission to delete media
    if (!canEditContent(userData)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Get the media ID from the request
    const url = new URL(request.url)
    const mediaId = url.searchParams.get("id")

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    // Get the media item to get its publicId
    const mediaCollection = await getCollection("media")
    const mediaItem = await mediaCollection.findOne({ _id: new ObjectId(mediaId) })

    if (!mediaItem) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 })
    }

    // Delete from Cloudinary if publicId exists
    if (mediaItem.publicId) {
      await deleteImage(mediaItem.publicId)
    }

    // Delete from MongoDB
    const result = await mediaCollection.deleteOne({ _id: new ObjectId(mediaId) })

    return NextResponse.json({ success: true, id: mediaId })
  } catch (error) {
    console.error("Error deleting media:", error)
    return NextResponse.json({ error: "Failed to delete media item" }, { status: 500 })
  }
}

