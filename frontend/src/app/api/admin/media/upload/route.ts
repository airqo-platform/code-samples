import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { canEditContent } from "@/lib/auth"
import { getCollection } from "@/lib/mongodb"
import { uploadImage } from "@/lib/cloudinary"

// POST handler to upload a new media item
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

    // Check if user has permission to upload media
    if (!canEditContent(userData)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Parse the request body
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are supported" }, { status: 400 })
    }

    // Validate file size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds the 5MB limit" }, { status: 400 })
    }

    // Convert file to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await uploadImage(buffer, {
      folder: "airqo/media",
      public_id: `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}`,
    })

    // Create a media item to store in MongoDB
    const mediaItem = {
      name: file.name,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      dimensions: {
        width: uploadResult.width,
        height: uploadResult.height,
      },
    }

    // Save to MongoDB
    const mediaCollection = await getCollection("media")
    const result = await mediaCollection.insertOne(mediaItem)

    // Return the media item with its ID
    return NextResponse.json({
      ...mediaItem,
      id: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Error uploading media:", error)
    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 })
  }
}

