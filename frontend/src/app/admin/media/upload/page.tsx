"use client"

import type React from "react"

import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export default function MediaUploadPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Create object URL for preview
      setPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Upload Media</CardTitle>
          <CardDescription>Upload new images or videos to your library.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="picture">Upload Picture</Label>
            <Input id="picture" type="file" onChange={handleFileChange} />
          </div>

          {previewUrl && (
            <div className="border rounded-md p-4">
              <Label>Preview</Label>
              <div className="relative w-full h-full">
                <Image
                  src={previewUrl || "/placeholder.svg"}
                  alt="Media preview"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    ;(e.target as any).src = "/placeholder.svg?height=400&width=800&text=Image+Not+Found"
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Media Name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Media Description" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="banners">Banners</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>Upload</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

