"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Copy, Trash2, Filter, Grid, List } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface MediaItem {
  _id: string
  filename: string
  url: string
  type: "image" | "document" | "video" | "other"
  size: number
  dimensions?: {
    width: number
    height: number
  }
  uploadedAt: string
  tags: string[]
}

export default function MediaLibraryPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedType, setSelectedType] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    const fetchMediaItems = async () => {
      try {
        const response = await fetch("/api/admin/media")
        if (!response.ok) {
          throw new Error("Failed to fetch media items")
        }
        const data = await response.json()
        setMediaItems(data)
      } catch (error) {
        console.error("Error fetching media:", error)
        // For demo purposes, use mock data if API fails
        const mockMediaItems: MediaItem[] = [
          {
            _id: "1",
            filename: "site-location.jpg",
            url: "/images/site-location.jpg",
            type: "image",
            size: 245000,
            dimensions: { width: 1200, height: 800 },
            uploadedAt: "2023-05-15T10:30:00Z",
            tags: ["feature", "location"],
          },
          {
            _id: "2",
            filename: "air-quality-categorization.jpg",
            url: "/images/air-quality-categorization.jpg",
            type: "image",
            size: 320000,
            dimensions: { width: 1200, height: 800 },
            uploadedAt: "2023-05-16T14:45:00Z",
            tags: ["feature", "air-quality"],
          },
          {
            _id: "3",
            filename: "data-analytics.jpg",
            url: "/images/data-analytics.jpg",
            type: "image",
            size: 280000,
            dimensions: { width: 1200, height: 800 },
            uploadedAt: "2023-05-17T09:15:00Z",
            tags: ["feature", "analytics"],
          },
          {
            _id: "4",
            filename: "machine-learning.jpg",
            url: "/images/machine-learning.jpg",
            type: "image",
            size: 310000,
            dimensions: { width: 1200, height: 800 },
            uploadedAt: "2023-05-18T11:20:00Z",
            tags: ["feature", "ai"],
          },
          {
            _id: "5",
            filename: "health-impact.jpg",
            url: "/images/health-impact.jpg",
            type: "image",
            size: 290000,
            dimensions: { width: 1200, height: 800 },
            uploadedAt: "2023-05-19T16:10:00Z",
            tags: ["feature", "health"],
          },
          {
            _id: "6",
            filename: "interactive-mapping.jpg",
            url: "/images/interactive-mapping.jpg",
            type: "image",
            size: 275000,
            dimensions: { width: 1200, height: 800 },
            uploadedAt: "2023-05-20T13:25:00Z",
            tags: ["feature", "mapping"],
          },
          {
            _id: "7",
            filename: "homeMAP.png",
            url: "/images/homeMAP.png",
            type: "image",
            size: 420000,
            dimensions: { width: 1600, height: 900 },
            uploadedAt: "2023-05-21T10:15:00Z",
            tags: ["home", "hero"],
          },
          {
            _id: "8",
            filename: "airqo-report.pdf",
            url: "/documents/airqo-report.pdf",
            type: "document",
            size: 1250000,
            uploadedAt: "2023-05-22T14:30:00Z",
            tags: ["report", "documentation"],
          },
          {
            _id: "9",
            filename: "sensor-deployment.mp4",
            url: "/videos/sensor-deployment.mp4",
            type: "video",
            size: 8500000,
            uploadedAt: "2023-05-23T09:45:00Z",
            tags: ["tutorial", "deployment"],
          },
          {
            _id: "10",
            filename: "GoodAir.png",
            url: "/images/GoodAir.png",
            type: "image",
            size: 45000,
            dimensions: { width: 200, height: 200 },
            uploadedAt: "2023-05-24T11:10:00Z",
            tags: ["icon", "air-quality"],
          },
          {
            _id: "11",
            filename: "Moderate.png",
            url: "/images/Moderate.png",
            type: "image",
            size: 48000,
            dimensions: { width: 200, height: 200 },
            uploadedAt: "2023-05-24T11:15:00Z",
            tags: ["icon", "air-quality"],
          },
          {
            _id: "12",
            filename: "Unhealthy.png",
            url: "/images/Unhealthy.png",
            type: "image",
            size: 47000,
            dimensions: { width: 200, height: 200 },
            uploadedAt: "2023-05-24T11:20:00Z",
            tags: ["icon", "air-quality"],
          },
        ]
        setMediaItems(mockMediaItems)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMediaItems()
  }, [])

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "URL Copied",
      description: "Media URL has been copied to clipboard",
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media item?")) {
      return
    }

    try {
      // In a real implementation, this would call an API
      // const response = await fetch(`/api/admin/media/${id}`, {
      //   method: 'DELETE',
      // })

      // if (!response.ok) {
      //   throw new Error('Failed to delete media item')
      // }

      // Simulate successful deletion
      setMediaItems((prev) => prev.filter((item) => item._id !== id))

      toast({
        title: "Media Deleted",
        description: "Media item has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting media:", error)
      toast({
        title: "Error",
        description: "Failed to delete media item",
        variant: "destructive",
      })
    }
  }

  const filteredMediaItems = mediaItems.filter((item) => {
    const matchesSearch =
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = selectedType === "all" || item.type === selectedType

    return matchesSearch && matchesType
  })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
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
        <Link href="/admin/media/upload">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Upload Media
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Media Assets</CardTitle>
          <CardDescription>Manage images, videos, and documents used across your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search by filename or tag..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {selectedType === "all" ? "All Types" : selectedType}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedType("all")}>All Types</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType("image")}>Images</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType("document")}>Documents</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType("video")}>Videos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType("other")}>Other</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="border rounded-md flex">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none rounded-l-md"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-none rounded-r-md"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {filteredMediaItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No media items found</div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMediaItems.map((item) => (
                <div key={item._id} className="border rounded-md overflow-hidden">
                  <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
                    {item.type === "image" ? (
                      <img
                        src={item.url || "/placeholder.svg"}
                        alt={item.filename}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=200"
                        }}
                      />
                    ) : item.type === "document" ? (
                      <div className="flex flex-col items-center justify-center p-4">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="mt-2 text-xs text-gray-500 truncate max-w-full">{item.filename}</span>
                      </div>
                    ) : item.type === "video" ? (
                      <div className="flex flex-col items-center justify-center p-4">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="mt-2 text-xs text-gray-500 truncate max-w-full">{item.filename}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="mt-2 text-xs text-gray-500 truncate max-w-full">{item.filename}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium truncate" title={item.filename}>
                        {item.filename}
                      </h3>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{formatFileSize(item.size)}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyUrl(item.url)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500"
                          onClick={() => handleDelete(item._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      File
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Size
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Uploaded
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Tags
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMediaItems.map((item) => (
                    <tr key={item._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                            {item.type === "image" ? (
                              <img
                                src={item.url || "/placeholder.svg"}
                                alt={item.filename}
                                className="h-10 w-10 object-cover rounded-md"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=40&width=40"
                                }}
                              />
                            ) : item.type === "document" ? (
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                            ) : item.type === "video" ? (
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={item.filename}>
                              {item.filename}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs" title={item.url}>
                              {item.url}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(item.size)}
                        {item.dimensions && (
                          <div className="text-xs text-gray-400">
                            {item.dimensions.width} × {item.dimensions.height}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => handleCopyUrl(item.url)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy URL
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-red-500"
                            onClick={() => handleDelete(item._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredMediaItems.length} of {mediaItems.length} media items
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

