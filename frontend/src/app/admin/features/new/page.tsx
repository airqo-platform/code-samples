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
  { value: "MapPin", label: "Map Pin" },
  { value: "Wind", label: "Wind" },
  { value: "BarChart3", label: "Bar Chart" },
  { value: "BrainCircuit", label: "Brain Circuit" },
  { value: "Shield", label: "Shield" },
  { value: "Sliders", label: "Sliders" },
]

export default function NewFeaturePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)

  const [feature, setFeature] = useState({
    title: "",
    slug: "",
    description: "",
    icon: "MapPin",
    status: "draft",
    content: {
      heroTitle: "",
      heroDescription: "",
      howItWorks: {
        title: "How It Works",
        steps: [
          { title: "", description: "" },
          { title: "", description: "" },
          { title: "", description: "" },
        ],
      },
      benefits: {
        title: "Key Benefits",
        items: [
          { title: "", description: "" },
          { title: "", description: "" },
          { title: "", description: "" },
          { title: "", description: "" },
        ],
      },
      ctaTitle: "",
      ctaButtonText: "Try Now",
    },
    seo: {
      title: "",
      description: "",
    },
    heroImage: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFeature((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleContentChange = (section: string, field: string, value: string) => {
    setFeature((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [section]: {
          ...prev.content[section as keyof typeof prev.content],
          [field]: value,
        },
      },
    }))
  }

  const handleStepChange = (index: number, field: string, value: string) => {
    setFeature((prev) => {
      const newSteps = [...prev.content.howItWorks.steps]
      newSteps[index] = {
        ...newSteps[index],
        [field]: value,
      }
      return {
        ...prev,
        content: {
          ...prev.content,
          howItWorks: {
            ...prev.content.howItWorks,
            steps: newSteps,
          },
        },
      }
    })
  }

  const handleBenefitChange = (index: number, field: string, value: string) => {
    setFeature((prev) => {
      const newBenefits = [...prev.content.benefits.items]
      newBenefits[index] = {
        ...newBenefits[index],
        [field]: value,
      }
      return {
        ...prev,
        content: {
          ...prev.content,
          benefits: {
            ...prev.content.benefits,
            items: newBenefits,
          },
        },
      }
    })
  }

  const handleSeoChange = (field: string, value: string) => {
    setFeature((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [field]: value,
      },
    }))
  }

  const handleStatusChange = (checked: boolean) => {
    setFeature((prev) => ({
      ...prev,
      status: checked ? "published" : "draft",
    }))
  }

  const generateSlug = () => {
    const slug = feature.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "-")

    setFeature((prev) => ({
      ...prev,
      slug,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feature.title) {
      toast({
        title: "Validation Error",
        description: "Feature title is required",
        variant: "destructive",
      })
      return
    }

    if (!feature.slug) {
      toast({
        title: "Validation Error",
        description: "Feature slug is required",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // In a real implementation, this would save to an API
      console.log("Saving new feature:", feature)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Success",
        description: "Feature created successfully",
      })

      router.push("/admin/features")
    } catch (error) {
      console.error("Failed to save feature:", error)
      toast({
        title: "Error",
        description: "Failed to create feature",
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
          <Link href="/admin/features">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">New Feature</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            className="flex items-center gap-2"
            onClick={() => router.push("/admin/features")}
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
                Save Feature
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
                <CardDescription>Basic information about the feature</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={feature.title}
                    onChange={handleInputChange}
                    placeholder="Feature title"
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
                    value={feature.slug}
                    onChange={handleInputChange}
                    placeholder="feature-slug"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={feature.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the feature"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select
                    value={feature.icon}
                    onValueChange={(value) => setFeature((prev) => ({ ...prev, icon: value }))}
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
                  <Switch id="status" checked={feature.status === "published"} onCheckedChange={handleStatusChange} />
                  <Label htmlFor="status">{feature.status === "published" ? "Published" : "Draft"}</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Feature Content</CardTitle>
                <CardDescription>Detailed content for the feature page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Hero Section</h3>

                  <div className="space-y-2">
                    <Label htmlFor="heroTitle">Hero Title</Label>
                    <Input
                      id="heroTitle"
                      value={feature.content.heroTitle}
                      onChange={(e) => handleContentChange("heroTitle", "", e.target.value)}
                      placeholder="Main title for the feature page"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heroDescription">Hero Description</Label>
                    <Textarea
                      id="heroDescription"
                      value={feature.content.heroDescription}
                      onChange={(e) => handleContentChange("heroDescription", "", e.target.value)}
                      placeholder="Detailed description of the feature"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">How It Works Section</h3>

                  <div className="space-y-2">
                    <Label htmlFor="howItWorksTitle">Section Title</Label>
                    <Input
                      id="howItWorksTitle"
                      value={feature.content.howItWorks.title}
                      onChange={(e) => handleContentChange("howItWorks", "title", e.target.value)}
                      placeholder="How It Works"
                    />
                  </div>

                  <div className="space-y-4">
                    {feature.content.howItWorks.steps.map((step, index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <h4 className="font-medium mb-2">Step {index + 1}</h4>
                        <div className="space-y-2">
                          <Label htmlFor={`step-${index}-title`}>Title</Label>
                          <Input
                            id={`step-${index}-title`}
                            value={step.title}
                            onChange={(e) => handleStepChange(index, "title", e.target.value)}
                            placeholder={`Step ${index + 1} title`}
                          />
                        </div>
                        <div className="space-y-2 mt-2">
                          <Label htmlFor={`step-${index}-description`}>Description</Label>
                          <Textarea
                            id={`step-${index}-description`}
                            value={step.description}
                            onChange={(e) => handleStepChange(index, "description", e.target.value)}
                            placeholder={`Step ${index + 1} description`}
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Benefits Section</h3>

                  <div className="space-y-2">
                    <Label htmlFor="benefitsTitle">Section Title</Label>
                    <Input
                      id="benefitsTitle"
                      value={feature.content.benefits.title}
                      onChange={(e) => handleContentChange("benefits", "title", e.target.value)}
                      placeholder="Key Benefits"
                    />
                  </div>

                  <div className="space-y-4">
                    {feature.content.benefits.items.map((benefit, index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <h4 className="font-medium mb-2">Benefit {index + 1}</h4>
                        <div className="space-y-2">
                          <Label htmlFor={`benefit-${index}-title`}>Title</Label>
                          <Input
                            id={`benefit-${index}-title`}
                            value={benefit.title}
                            onChange={(e) => handleBenefitChange(index, "title", e.target.value)}
                            placeholder={`Benefit ${index + 1} title`}
                          />
                        </div>
                        <div className="space-y-2 mt-2">
                          <Label htmlFor={`benefit-${index}-description`}>Description</Label>
                          <Textarea
                            id={`benefit-${index}-description`}
                            value={benefit.description}
                            onChange={(e) => handleBenefitChange(index, "description", e.target.value)}
                            placeholder={`Benefit ${index + 1} description`}
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Call to Action</h3>

                  <div className="space-y-2">
                    <Label htmlFor="ctaTitle">CTA Title</Label>
                    <Input
                      id="ctaTitle"
                      value={feature.content.ctaTitle}
                      onChange={(e) => handleContentChange("ctaTitle", "", e.target.value)}
                      placeholder="Ready to try this feature?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ctaButtonText">Button Text</Label>
                    <Input
                      id="ctaButtonText"
                      value={feature.content.ctaButtonText}
                      onChange={(e) => handleContentChange("ctaButtonText", "", e.target.value)}
                      placeholder="Try Now"
                    />
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
                <CardDescription>Images and other media for the feature</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Hero Image</h3>

                  <div className="space-y-2">
                    <Label htmlFor="heroImage">Image Path</Label>
                    <div className="flex gap-2">
                      <Input
                        id="heroImage"
                        value={feature.heroImage}
                        onChange={(e) => setFeature((prev) => ({ ...prev, heroImage: e.target.value }))}
                        placeholder="/images/feature-image.jpg"
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Browse
                      </Button>
                    </div>
                  </div>

                  {feature.heroImage && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Preview</h4>
                      <div className="relative h-[200px] w-full rounded-md overflow-hidden border">
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <img
                            src={feature.heroImage || "/placeholder.svg"}
                            alt="Hero preview"
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
                <CardDescription>Search engine optimization settings for the feature page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={feature.seo.title}
                    onChange={(e) => handleSeoChange("title", e.target.value)}
                    placeholder="SEO title (appears in browser tab)"
                  />
                  <p className="text-xs text-gray-500">Recommended length: 50-60 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoDescription">Meta Description</Label>
                  <Textarea
                    id="seoDescription"
                    value={feature.seo.description}
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

