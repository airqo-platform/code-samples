import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { canEditContent } from "@/lib/auth"
import { getCollection } from "@/lib/mongodb"
import { deleteImage } from "@/lib/cloudinary"
import { ObjectId } from "mongodb"

// GET handler to retrieve a specific media item by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Get media item from MongoDB
    const mediaCollection = await getCollection("media")
    const mediaItem = await mediaCollection.findOne({ _id: new ObjectId(id) })

    if (!mediaItem) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 })
    }

    return NextResponse.json(mediaItem)
  } catch (error) {
    console.error("Error fetching media item:", error)
    return NextResponse.json({ error: "Failed to fetch media item" }, { status: 500 })
  }
}

// DELETE handler to remove a specific media item by ID
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

    // Check if user has permission to delete media
    if (!canEditContent(userData)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const id = params.id

    // Get the media item to get its publicId
    const mediaCollection = await getCollection("media")
    const mediaItem = await mediaCollection.findOne({ _id: new ObjectId(id) })

    if (!mediaItem) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 })
    }

    // Delete from Cloudinary if publicId exists
    if (mediaItem.publicId) {
      await deleteImage(mediaItem.publicId)
    }

    // Delete from MongoDB
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await mediaCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting media item:", error)
    return NextResponse.json({ error: "Failed to delete media item" }, { status: 500 })
  }
}

