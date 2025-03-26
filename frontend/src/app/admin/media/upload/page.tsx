"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, X, Plus, Image, FileText, Video, File } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface FilePreview {
  file: File
  preview: string
  type: "image" | "document" | "video" | "other"
}

export default function UploadMediaPage() {
  const [files, setFiles] = useState<FilePreview[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const newFiles: FilePreview[] = []

    Array.from(e.target.files).forEach((file) => {
      let type: "image" | "document" | "video" | "other" = "other"
      let preview = ""

      if (file.type.startsWith("image/")) {
        type = "image"
        preview = URL.createObjectURL(file)
      } else if (file.type.includes("pdf") || file.type.includes("document") || file.type.includes("text")) {
        type = "document"
      } else if (file.type.startsWith("video/")) {
        type = "video"
      }

      newFiles.push({ file, preview, type })
    })

    setFiles((prev) => [...prev, ...newFiles])

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      // Revoke the object URL to avoid memory leaks
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (index: number) => {
    setTags((prev) => {
      const newTags = [...prev]
      newTags.splice(index, 1)
      return newTags
    })
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // In a real implementation, this would upload to a server
      // and store metadata in MongoDB

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Upload Successful",
        description: `${files.length} file(s) uploaded successfully`,
      })

      router.push("/admin/media")
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-6 w-6 text-blue-500" />
      case "document":
        return <FileText className="h-6 w-6 text-red-500" />
      case "video":
        return <Video className="h-6 w-6 text-purple-500" />
      default:
        return <File className="h-6 w-6 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/admin/media">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Upload Media</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>Upload images, documents, and other media files to your library</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
            <Upload className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">Drag and drop files here, or click to select files</p>
            <p className="mt-1 text-xs text-gray-500">Supports images, documents, videos, and other file types</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Select Files
            </Button>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Selected Files ({files.length})</h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {file.type === "image" && file.preview ? (
                          <div className="h-12 w-12 rounded-md overflow-hidden">
                            <img
                              src={file.preview || "/placeholder.svg"}
                              alt={file.file.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                            {getFileIcon(file.type)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-xs" title={file.file.name}>
                          {file.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.file.size / 1024).toFixed(1)} KB • {file.type}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-red-500"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <div key={index} className="flex items-center bg-gray-100 text-gray-800 text-sm rounded-full px-3 py-1">
                  {tag}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 text-gray-500 hover:text-red-500"
                    onClick={() => removeTag(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add tags (e.g., hero, feature, icon)"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addTag} disabled={!tagInput.trim()}>
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-500">Press Enter to add a tag. Tags help organize and find your media.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/admin/media")}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Files
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

