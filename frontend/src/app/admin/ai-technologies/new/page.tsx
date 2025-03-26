"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Trash2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const ICON_OPTIONS = [
  { value: "BrainCircuit", label: "Brain Circuit" },
  { value: "LineChart", label: "Line Chart" },
  { value: "Sliders", label: "Sliders" },
  { value: "MapPin", label: "Map Pin" },
  { value: "Satellite", label: "Satellite" },
  { value: "Factory", label: "Factory" },
]

export default function NewAITechnologyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)

  const [technology, setTechnology] = useState({
    title: "",
    slug: "",
    description: "",
    icon: "BrainCircuit",
    status: "draft",
    content: {
      overview: "",
      technicalDetails: "",
      useCases: [
        { title: "", description: "" },
        { title: "", description: "" },
        { title: "", description: "" },
      ],
      performance: {
        metrics: [
          { name: "Accuracy", value: "" },
          { name: "Latency", value: "" },
          { name: "Reliability", value: "" },
        ],
      },
    },
    seo: {
      title: "",
      description: "",
    },
    image: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setTechnology((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleContentChange = (field: string, value: string) => {
    setTechnology((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value,
      },
    }))
  }

  const handleUseCaseChange = (index: number, field: string, value: string) => {
    setTechnology((prev) => {
      const newUseCases = [...prev.content.useCases]
      newUseCases[index] = {
        ...newUseCases[index],
        [field]: value,
      }
      return {
        ...prev,
        content: {
          ...prev.content,
          useCases: newUseCases,
        },
      }
    })
  }

  const handleMetricChange = (index: number, field: string, value: string) => {
    setTechnology((prev) => {
      const newMetrics = [...prev.content.performance.metrics]
      newMetrics[index] = {
        ...newMetrics[index],
        [field]: value,
      }
      return {
        ...prev,
        content: {
          ...prev.content,
          performance: {
            ...prev.content.performance,
            metrics: newMetrics,
          },
        },
      }
    })
  }

  const handleSeoChange = (field: string, value: string) => {
    setTechnology((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [field]: value,
      },
    }))
  }

  const handleStatusChange = (checked: boolean) => {
    setTechnology((prev) => ({
      ...prev,
      status: checked ? "published" : "draft",
    }))
  }

  const generateSlug = () => {
    const slug = technology.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "-")

    setTechnology((prev) => ({
      ...prev,
      slug,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!technology.title) {
      toast({
        title: "Validation Error",
        description: "Technology title is required",
        variant: "destructive",
      })
      return
    }

    if (!technology.slug) {
      toast({
        title: "Validation Error",
        description: "Technology slug is required",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // In a real implementation, this would save to an API
      console.log("Saving new AI technology:", technology)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Success",
        description: "AI Technology created successfully",
      })

      router.push("/admin/ai-technologies")
    } catch (error) {
      console.error("Failed to save AI technology:", error)
      toast({
        title: "Error",
        description: "Failed to create AI technology",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/admin/ai-technologies">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">New AI Technology</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            className="flex items-center gap-2"
            onClick={() => router.push("/admin/ai-technologies")}
          >
            <Trash2 className="h-4 w-4" />
            Cancel
          </Button>
          <Button className="flex items-center gap-2" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Technology
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Basic information about the AI technology</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={technology.title}
                    onChange={handleInputChange}
                    placeholder="AI Technology title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="slug">Slug</Label>
                    <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={generateSlug}>
                      Generate from title
                    </Button>
                  </div>
                  <Input
                    id="slug"
                    name="slug"
                    value={technology.slug}
                    onChange={handleInputChange}
                    placeholder="technology-slug"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={technology.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the AI technology"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select
                    value={technology.icon}
                    onValueChange={(value) => setTechnology((prev) => ({ ...prev, icon: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="status"
                    checked={technology.status === "published"}
                    onCheckedChange={handleStatusChange}
                  />
                  <Label htmlFor="status">{technology.status === "published" ? "Published" : "Draft"}</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Technology Content</CardTitle>
                <CardDescription>Detailed content for the AI technology page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Overview</h3>
                  <div className="space-y-2">
                    <Label htmlFor="overview">Technology Overview</Label>
                    <Textarea
                      id="overview"
                      value={technology.content.overview}
                      onChange={(e) => handleContentChange("overview", e.target.value)}
                      placeholder="Comprehensive overview of the AI technology"
                      rows={6}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Technical Details</h3>
                  <div className="space-y-2">
                    <Label htmlFor="technicalDetails">Technical Information</Label>
                    <Textarea
                      id="technicalDetails"
                      value={technology.content.technicalDetails}
                      onChange={(e) => handleContentChange("technicalDetails", e.target.value)}
                      placeholder="Technical details, algorithms, and implementation information"
                      rows={6}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Use Cases</h3>
                  <div className="space-y-4">
                    {technology.content.useCases.map((useCase, index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <h4 className="font-medium mb-2">Use Case {index + 1}</h4>
                        <div className="space-y-2">
                          <Label htmlFor={`useCase-${index}-title`}>Title</Label>
                          <Input
                            id={`useCase-${index}-title`}
                            value={useCase.title}
                            onChange={(e) => handleUseCaseChange(index, "title", e.target.value)}
                            placeholder={`Use case ${index + 1} title`}
                          />
                        </div>
                        <div className="space-y-2 mt-2">
                          <Label htmlFor={`useCase-${index}-description`}>Description</Label>
                          <Textarea
                            id={`useCase-${index}-description`}
                            value={useCase.description}
                            onChange={(e) => handleUseCaseChange(index, "description", e.target.value)}
                            placeholder={`Use case ${index + 1} description`}
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Performance Metrics</h3>
                  <div className="space-y-4">
                    {technology.content.performance.metrics.map((metric, index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`metric-${index}-name`}>Metric Name</Label>
                            <Input
                              id={`metric-${index}-name`}
                              value={metric.name}
                              onChange={(e) => handleMetricChange(index, "name", e.target.value)}
                              placeholder="Metric name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`metric-${index}-value`}>Value</Label>
                            <Input
                              id={`metric-${index}-value`}
                              value={metric.value}
                              onChange={(e) => handleMetricChange(index, "value", e.target.value)}
                              placeholder="Metric value"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media">
            <Card>
              <CardHeader>
                <CardTitle>Media Assets</CardTitle>
                <CardDescription>Images and other media for the AI technology</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Technology Image</h3>

                  <div className="space-y-2">
                    <Label htmlFor="image">Image Path</Label>
                    <div className="flex gap-2">
                      <Input
                        id="image"
                        value={technology.image}
                        onChange={(e) => setTechnology((prev) => ({ ...prev, image: e.target.value }))}
                        placeholder="/images/technology-image.jpg"
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Browse
                      </Button>
                    </div>
                  </div>

                  {technology.image && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Preview</h4>
                      <div className="relative h-[200px] w-full rounded-md overflow-hidden border">
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <img
                            src={technology.image || "/placeholder.svg"}
                            alt="Technology preview"
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=400"
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Search engine optimization settings for the technology page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={technology.seo.title}
                    onChange={(e) => handleSeoChange("title", e.target.value)}
                    placeholder="SEO title (appears in browser tab)"
                  />
                  <p className="text-xs text-gray-500">Recommended length: 50-60 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoDescription">Meta Description</Label>
                  <Textarea
                    id="seoDescription"
                    value={technology.seo.description}
                    onChange={(e) => handleSeoChange("description", e.target.value)}
                    placeholder="Brief description for search engines"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">Recommended length: 150-160 characters</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}

