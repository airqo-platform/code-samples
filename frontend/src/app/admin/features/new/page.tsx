import Image from "next/image"

export default function NewFeaturePage() {
  const previewUrl = null // Replace with actual preview URL if available

  return (
    <div>
      <h1>New Feature Page</h1>
      <div className="relative w-full h-64">
        {/* Replace the <img> element with <Image> */}
        <Image
          src={previewUrl || "/placeholder.svg?height=400&width=800&text=Preview"}
          alt="Preview"
          fill
          className="object-cover"
          onError={(e) => {
            ;(e.target as any).src = "/placeholder.svg?height=400&width=800&text=Image+Not+Found"
          }}
        />
      </div>
    </div>
  )
}

