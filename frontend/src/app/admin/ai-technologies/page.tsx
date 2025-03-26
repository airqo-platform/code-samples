"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, ArrowUpDown } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface AITechnology {
  id: string
  title: string
  slug: string
  description: string
  icon: string
  status: "published" | "draft"
  updatedAt: string
}

export default function AITechnologiesPage() {
  const [technologies, setTechnologies] = useState<AITechnology[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof AITechnology>("updatedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const fetchTechnologies = async () => {
      try {
        // In a real implementation, this would fetch from an API
        // For now, we'll simulate with static data
        const mockTechnologies: AITechnology[] = [
          {
            id: "1",
            title: "Forecasting AI",
            slug: "forecasting-ai",
            description: "Predicts air quality conditions up to 7 days in advance with high accuracy.",
            icon: "LineChart",
            status: "published",
            updatedAt: "2023-05-15T10:30:00Z",
          },
          {
            id: "2",
            title: "Calibration AI",
            slug: "calibration-ai",
            description: "Transforms data from low-cost sensors into reference-grade measurements.",
            icon: "Sliders",
            status: "published",
            updatedAt: "2023-05-20T14:45:00Z",
          },
          {
            id: "3",
            title: "Location AI",
            slug: "location-ai",
            description: "Optimizes the placement of air quality monitors to maximize coverage.",
            icon: "MapPin",
            status: "published",
            updatedAt: "2023-05-18T09:15:00Z",
          },
          {
            id: "4",
            title: "Satellite PM2.5 AI",
            slug: "satellite-pm25-ai",
            description: "Predicts PM2.5 concentrations in areas without ground-based monitors.",
            icon: "Satellite",
            status: "published",
            updatedAt: "2023-05-22T11:20:00Z",
          },
          {
            id: "5",
            title: "Source Prediction AI",
            slug: "source-prediction-ai",
            description: "Identifies and characterizes stationary pollution sources.",
            icon: "Factory",
            status: "published",
            updatedAt: "2023-05-17T16:10:00Z",
          },
        ]

        setTechnologies(mockTechnologies)
      } catch (error) {
        console.error("Failed to fetch AI technologies:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTechnologies()
  }, [])

  const handleSort = (field: keyof AITechnology) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredTechnologies = technologies.filter(
    (tech) =>
      tech.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedTechnologies = [...filteredTechnologies].sort((a, b) => {
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
        <h1 className="text-3xl font-bold">AI Technologies</h1>
        <Link href="/admin/ai-technologies/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Technology
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage AI Technologies</CardTitle>
          <CardDescription>View and manage the AI technologies displayed on your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search technologies..."
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
                {sortedTechnologies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No AI technologies found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTechnologies.map((tech) => (
                    <TableRow key={tech.id}>
                      <TableCell className="font-medium">{tech.id}</TableCell>
                      <TableCell>{tech.title}</TableCell>
                      <TableCell>{tech.slug}</TableCell>
                      <TableCell>
                        <Badge variant={tech.status === "published" ? "default" : "secondary"}>{tech.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(tech.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/ai-technologies/edit/${tech.id}`}>
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
            Showing {sortedTechnologies.length} of {technologies.length} AI technologies
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

