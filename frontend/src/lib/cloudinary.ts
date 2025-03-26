import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Function to upload an image to Cloudinary
export async function uploadImage(file: Buffer, options: { folder?: string; public_id?: string } = {}) {
  return new Promise<{ secure_url: string; public_id: string; width: number; height: number; format: string }>(
    (resolve, reject) => {
      // Create a stream from the buffer
      const uploadOptions = {
        folder: options.folder || "airqo",
        public_id: options.public_id,
        resource_type: "auto",
      }

      // Upload stream to Cloudinary
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            return reject(error)
          }
          if (!result) {
            return reject(new Error("Upload failed with no error"))
          }
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          })
        })
        .end(file)
    },
  )
}

// Function to delete an image from Cloudinary
export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId)
}

// Function to get image details from Cloudinary
export async function getImageDetails(publicId: string) {
  return cloudinary.api.resource(publicId)
}

