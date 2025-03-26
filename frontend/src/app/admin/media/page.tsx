"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Trash2, Copy, FolderOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { canEditContent } from "@/lib/auth"
import { MediaUpload } from "@/components/admin/media-upload"

interface MediaItem {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
  dimensions?: {
    width: number
    height: number
  }
}

export default function MediaLibraryPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [newMediaUrl, setNewMediaUrl] = useState("")
  const { toast } = useToast()
  const { user } = useAuth()

  // Check if user has edit permissions
  const canEdit = canEditContent(user)

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        // In a real implementation, this would fetch from an API
        // For now, we'll simulate with static data
        const mockMedia: MediaItem[] = [
          {
            id: "1",
            name: "site-location.jpg",
            url: "/placeholder.svg?height=400&width=800&text=Site+Location",
            type: "image/jpeg",
            size: 245000,
            uploadedAt: "2023-07-15T10:30:00Z",
            dimensions: {
              width: 1200,
              height: 800,
            },
          },
          {
            id: "2",
            name: "air-quality-map.png",
            url: "/placeholder.svg?height=400&width=800&text=Air+Quality+Map",
            type: "image/png",
            size: 350000,
            uploadedAt: "2023-07-14T15:45:00Z",
            dimensions: {
              width: 1600,
              height: 900,
            },
          },
          {
            id: "3",
            name: "dashboard-preview.jpg",
            url: "/placeholder.svg?height=400&width=800&text=Dashboard+Preview",
            type: "image/jpeg",
            size: 420000,
            uploadedAt: "2023-07-10T09:20:00Z",
            dimensions: {
              width: 1920,
              height: 1080,
            },
          },
          {
            id: "4",
            name: "logo.svg",
            url: "/placeholder.svg?height=400&width=400&text=Logo",
            type: "image/svg+xml",
            size: 15000,
            uploadedAt: "2023-06-25T14:10:00Z",
          },
        ]

        setMediaItems(mockMedia)
      } catch (error) {
        console.error("Failed to fetch media:", error)
        toast({
          title: "Error",
          description: "Failed to load media library",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMedia()
  }, [toast])

  const filteredItems = mediaItems.filter((item) => {
    // Filter by search query
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())

    // Filter by type
    if (activeTab === "all") return matchesSearch
    if (activeTab === "images") return matchesSearch && item.type.startsWith("image/")
    if (activeTab === "documents")
      return (
        matchesSearch &&
        (item.type.includes("pdf") ||
          item.type.includes("doc") ||
          item.type.includes("xls") ||
          item.type.includes("ppt"))
      )

    return matchesSearch
  })

  const handleDeleteMedia = async (id: string) => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete media",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Are you sure you want to delete this media item?")) {
      return
    }

    try {
      // In a real implementation, this would call an API
      // Simulate API call
      setMediaItems((prev) => prev.filter((item) => item.id !== id))

      if (selectedItem?.id === id) {
        setSelectedItem(null)
      }

      toast({
        title: "Success",
        description: "Media deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete media:", error)
      toast({
        title: "Error",
        description: "Failed to delete media",
        variant: "destructive",
      })
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "URL Copied",
      description: "Media URL copied to clipboard",
    })
  }

  const handleAddMedia = () => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to add media",
        variant: "destructive",
      })
      return
    }

    if (!newMediaUrl) {
      toast({
        title: "Error",
        description: "Please provide a media URL or upload a file",
        variant: "destructive",
      })
      return
    }

    // In a real implementation, this would call an API to add the media
    // For now, we'll simulate adding it to our local state
    const newItem: MediaItem = {
      id: `new-${Date.now()}`,
      name: newMediaUrl.split("/").pop() || `media-${Date.now()}`,
      url: newMediaUrl,
      type: "image/jpeg", // Assuming it's an image
      size: 100000, // Dummy size
      uploadedAt: new Date().toISOString(),
      dimensions: {
        width: 800,
        height: 600,
      },
    }

    setMediaItems((prev) => [newItem, ...prev])
    setNewMediaUrl("")

    toast({
      title: "Success",
      description: "Media added successfully",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Media Library</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Media Assets</CardTitle>
          <CardDescription>Manage your images and other media files</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="all">All Media</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search media..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="all" className="mt-0">
              <div className="space-y-6">
                {/* Upload Section */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Add New Media</h3>
                      <MediaUpload currentImageUrl={newMediaUrl} onImageSelected={setNewMediaUrl} disabled={!canEdit} />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddMedia}
                          disabled={!newMediaUrl || !canEdit}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add to Library
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Media Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No media items found</p>
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <Card
                        key={item.id}
                        className={`overflow-hidden cursor-pointer transition-shadow hover:shadow-md ${
                          selectedItem?.id === item.id ? "ring-2 ring-blue-500" : ""
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="aspect-video relative bg-gray-100">
                          <img
                            src={item.url || "/placeholder.svg"}
                            alt={item.name}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                "/placeholder.svg?height=200&width=300&text=Preview+Not+Available"
                            }}
                          />
                        </div>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="truncate">
                              <p className="font-medium truncate" title={item.name}>
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(item.size)} • {formatDate(item.uploadedAt)}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyUrl(item.url)
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteMedia(item.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="images" className="mt-0">
              {/* Same structure as "all" tab but filtered for images */}
              <div className="space-y-6">
                {/* Upload Section (same as above) */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Add New Image</h3>
                      <MediaUpload currentImageUrl={newMediaUrl} onImageSelected={setNewMediaUrl} disabled={!canEdit} />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddMedia}
                          disabled={!newMediaUrl || !canEdit}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add to Library
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Media Grid (filtered for images) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No images found</p>
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <Card
                        key={item.id}
                        className={`overflow-hidden cursor-pointer transition-shadow hover:shadow-md ${
                          selectedItem?.id === item.id ? "ring-2 ring-blue-500" : ""
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="aspect-video relative bg-gray-100">
                          <img
                            src={item.url || "/placeholder.svg"}
                            alt={item.name}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                "/placeholder.svg?height=200&width=300&text=Preview+Not+Available"
                            }}
                          />
                        </div>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="truncate">
                              <p className="font-medium truncate" title={item.name}>
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(item.size)} • {formatDate(item.uploadedAt)}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyUrl(item.url)
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteMedia(item.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              {/* Similar structure for documents tab */}
              <div className="col-span-full text-center py-12 text-gray-500">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No documents found</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Media Details Panel (shows when an item is selected) */}
      {selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle>Media Details</CardTitle>
            <CardDescription>Information about the selected media</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                <img
                  src={selectedItem.url || "/placeholder.svg"}
                  alt={selectedItem.name}
                  className="max-w-full max-h-[300px] object-contain"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      "/placeholder.svg?height=300&width=400&text=Preview+Not+Available"
                  }}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-500">File Name</Label>
                  <p className="font-medium">{selectedItem.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">URL</Label>
                  <div className="flex gap-2 items-center">
                    <Input value={selectedItem.url} readOnly className="bg-gray-50" />
                    <Button variant="outline" size="icon" onClick={() => handleCopyUrl(selectedItem.url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Type</Label>
                    <p>{selectedItem.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Size</Label>
                    <p>{formatFileSize(selectedItem.size)}</p>
                  </div>
                  {selectedItem.dimensions && (
                    <>
                      <div>
                        <Label className="text-sm text-gray-500">Width</Label>
                        <p>{selectedItem.dimensions.width}px</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Height</Label>
                        <p>{selectedItem.dimensions.height}px</p>
                      </div>
                    </>
                  )}
                  <div>
                    <Label className="text-sm text-gray-500">Uploaded</Label>
                    <p>{formatDate(selectedItem.uploadedAt)}</p>
                  </div>
                </div>
                {canEdit && (
                  <div className="pt-4">
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteMedia(selectedItem.id)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Media
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

