"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, ArrowUpDown } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Feature {
  id: string
  title: string
  slug: string
  description: string
  icon: string
  status: "published" | "draft"
  updatedAt: string
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof Feature>("updatedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        // In a real implementation, this would fetch from an API
        // For now, we'll simulate with static data
        const mockFeatures: Feature[] = [
          {
            id: "1",
            title: "Optimal Site Location",
            slug: "site-location",
            description: "Use AI algorithms to determine the best locations for air quality monitors.",
            icon: "MapPin",
            status: "published",
            updatedAt: "2023-05-15T10:30:00Z",
          },
          {
            id: "2",
            title: "Air Quality Categorization",
            slug: "air-quality-categorization",
            description: "Automatically categorize monitoring sites based on surrounding factors.",
            icon: "Wind",
            status: "published",
            updatedAt: "2023-05-20T14:45:00Z",
          },
          {
            id: "3",
            title: "Data Analytics",
            slug: "data-analytics",
            description: "Generate comprehensive reports with trends and insights.",
            icon: "BarChart3",
            status: "published",
            updatedAt: "2023-05-18T09:15:00Z",
          },
          {
            id: "4",
            title: "Machine Learning Models",
            slug: "machine-learning",
            description: "Continuously improving prediction models for air quality.",
            icon: "BrainCircuit",
            status: "published",
            updatedAt: "2023-05-22T11:20:00Z",
          },
          {
            id: "5",
            title: "Health Impact Assessment",
            slug: "health-impact",
            description: "Evaluate potential health impacts of air pollution.",
            icon: "Shield",
            status: "published",
            updatedAt: "2023-05-17T16:10:00Z",
          },
          {
            id: "6",
            title: "Interactive Mapping",
            slug: "interactive-mapping",
            description: "Visualize air quality data across regions with interactive maps.",
            icon: "MapPin",
            status: "published",
            updatedAt: "2023-05-19T13:25:00Z",
          },
        ]

        setFeatures(mockFeatures)
      } catch (error) {
        console.error("Failed to fetch features:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeatures()
  }, [])

  const handleSort = (field: keyof Feature) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredFeatures = features.filter(
    (feature) =>
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedFeatures = [...filteredFeatures].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1
    if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1
    return 0
  })

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
        <h1 className="text-3xl font-bold">Features</h1>
        <Link href="/admin/features/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Feature
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Features</CardTitle>
          <CardDescription>View and manage the features displayed on your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search features..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">ID</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                    <div className="flex items-center">
                      Title
                      {sortField === "title" && <ArrowUpDown size={14} className="ml-2" />}
                    </div>
                  </TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("updatedAt")}>
                    <div className="flex items-center">
                      Last Updated
                      {sortField === "updatedAt" && <ArrowUpDown size={14} className="ml-2" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFeatures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No features found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedFeatures.map((feature) => (
                    <TableRow key={feature.id}>
                      <TableCell className="font-medium">{feature.id}</TableCell>
                      <TableCell>{feature.title}</TableCell>
                      <TableCell>{feature.slug}</TableCell>
                      <TableCell>
                        <Badge variant={feature.status === "published" ? "default" : "secondary"}>
                          {feature.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(feature.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/features/edit/${feature.id}`}>
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="icon" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            Showing {sortedFeatures.length} of {features.length} features
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

