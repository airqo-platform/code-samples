"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AITechnologyFormData {
  name: string
  description: string
  prompt: string
  seed?: string
  negativePrompt?: string
  modelId?: string
  imageUrl?: string
}

export default function AITechnologiesNewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<AITechnologyFormData>({
    name: "",
    description: "",
    prompt: "",
    seed: "",
    negativePrompt: "",
    modelId: "",
    imageUrl: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePreview = async () => {
    if (!formData.prompt) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt to generate a preview",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGenerating(true)
      // In a real implementation, this would call an API to generate an image
      // For now, we'll just use a placeholder
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setPreviewUrl(`/placeholder.svg?height=400&width=800&text=${encodeURIComponent(formData.name || "AI Preview")}`)

      toast({
        title: "Preview generated",
        description: "Preview image has been generated successfully",
      })
    } catch (error) {
      console.error("Error generating preview:", error)
      toast({
        title: "Generation failed",
        description: "There was an error generating the preview",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description || !formData.prompt) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      // In a real implementation, this would call an API to save the data
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "AI Technology created!",
        description: "You've successfully created a new AI Technology.",
      })

      router.push("/admin/ai-technologies")
    } catch (error) {
      console.error("Error creating AI technology:", error)
      toast({
        title: "Submission failed",
        description: "There was an error creating the AI Technology",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
          <h1 className="text-3xl font-bold">Create AI Technology</h1>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
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

      <Card>
        <CardHeader>
          <CardTitle>AI Technology Information</CardTitle>
          <CardDescription>Enter the details for the new AI Technology</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="AI Technology Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Brief description of the AI Technology"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  name="prompt"
                  placeholder="Enter the prompt for the AI Technology"
                  value={formData.prompt}
                  onChange={handleChange}
                  required
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="negativePrompt">Negative Prompt</Label>
                <Textarea
                  id="negativePrompt"
                  name="negativePrompt"
                  placeholder="Enter the negative prompt for the AI Technology"
                  value={formData.negativePrompt}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seed">Seed</Label>
                <Input
                  id="seed"
                  name="seed"
                  placeholder="Enter the seed for the AI Technology"
                  value={formData.seed}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelId">Model ID</Label>
                <Input
                  id="modelId"
                  name="modelId"
                  placeholder="Enter the Model ID for the AI Technology"
                  value={formData.modelId}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                placeholder="Enter the Image URL for the AI Technology"
                value={formData.imageUrl}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handlePreview}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Preview"
                )}
              </Button>

              {previewUrl ? (
                <div className="relative w-full h-[400px] border rounded-md overflow-hidden">
                  <Image
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      ;(e.target as any).src = "/placeholder.svg?height=400&width=800&text=Image+Not+Found"
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-[400px] bg-gray-100 rounded-md flex items-center justify-center">
                  <p className="text-gray-500">Preview will appear here</p>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

