"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MediaUploadProps {
  currentImageUrl: string
  onImageSelected: (url: string) => void
  disabled?: boolean
}

export function MediaUpload({ currentImageUrl, onImageSelected, disabled = false }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || "")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset states
    setUploadError(null)
    setIsUploading(true)

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file")
      setIsUploading(false)
      return
    }

    try {
      // Create a local preview
      const localPreview = URL.createObjectURL(file)
      setPreviewUrl(localPreview)

      // In a real implementation, upload to Cloudinary
      // For now, we'll simulate the upload with a delay
      await simulateUpload(file)

      // In a real implementation, this would be the URL returned from Cloudinary
      const uploadedUrl = `/placeholder.svg?height=400&width=800&text=${encodeURIComponent(file.name)}`

      // Update the parent component with the new URL
      onImageSelected(uploadedUrl)

      toast({
        title: "Upload successful",
        description: "Image has been uploaded successfully",
      })
    } catch (error) {
      console.error("Upload failed:", error)
      setUploadError("Failed to upload image. Please try again.")
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Simulate an upload to Cloudinary
  const simulateUpload = async (file: File) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          secure_url: `/placeholder.svg?height=400&width=800&text=${encodeURIComponent(file.name)}`,
        })
      }, 1500)
    })
  }

  const handleBrowseClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const handleClearImage = () => {
    if (disabled) return
    setPreviewUrl("")
    onImageSelected("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="image-upload">Image Upload</Label>
        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearImage}
            disabled={disabled}
            className="h-8 px-2 text-red-500"
          >
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div
              className={`relative aspect-video flex items-center justify-center bg-gray-100 border-2 border-dashed rounded-md ${
                disabled ? "opacity-70" : "cursor-pointer"
              }`}
              onClick={handleBrowseClick}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                  <p className="text-sm text-gray-500">Uploading...</p>
                </div>
              ) : previewUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      // If image fails to load, use a placeholder
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=400&width=800&text=Image+Not+Found"
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6">
                  <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No image selected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="image-url"
                value={previewUrl}
                onChange={(e) => {
                  setPreviewUrl(e.target.value)
                  onImageSelected(e.target.value)
                }}
                placeholder="Enter image URL or upload"
                className="flex-1"
                disabled={disabled}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleBrowseClick}
                disabled={isUploading || disabled}
                className="flex items-center gap-1"
              >
                <Upload className="h-4 w-4" />
                Browse
              </Button>
            </div>
            {uploadError && <p className="text-sm text-red-500 mt-1">{uploadError}</p>}
          </div>

          <div className="text-sm text-gray-500">
            <p>Supported formats: JPG, PNG, GIF, WebP</p>
            <p>Maximum file size: 5MB</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}

