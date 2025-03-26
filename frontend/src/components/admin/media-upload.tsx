"use client"

import type React from "react"
import Image from "next/image"

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

      // Create form data for upload
      const formData = new FormData()
      formData.append("file", file)

      // Upload to the API
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const data = await response.json()

      // Update the parent component with the new URL
      onImageSelected(data.url)

      toast({
        title: "Upload successful",
        description: "Image has been uploaded successfully",
      })
    } catch (error) {
      console.error("Upload failed:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to upload image. Please try again.")
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was a problem uploading your image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
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

  // Helper function to ensure image URLs are valid
  const getImageUrl = (url: string) => {
    if (!url) return ""

    // If it's already a placeholder URL, return it
    if (url.startsWith("/placeholder.svg")) {
      return url
    }

    // For other URLs, add a fallback in case they fail to load
    return url
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
                  <Image
                    src={getImageUrl(previewUrl) || "/placeholder.svg"}
                    alt="Preview"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // If image fails to load, use a placeholder
                      ;(e.target as any).src = "/placeholder.svg?height=400&width=800&text=Image+Not+Found"
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

