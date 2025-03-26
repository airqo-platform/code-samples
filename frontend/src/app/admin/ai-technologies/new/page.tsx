"use client"

import Image from "next/image"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/convex/_generated/api"
import { useMutation } from "convex/react"
import { Skeleton } from "@/components/ui/skeleton"

const aiTechnologySchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  seed: z.string().optional(),
  negativePrompt: z.string().optional(),
  modelId: z.string().optional(),
  imageUrl: z.string().optional(),
})

const AITechnologiesNewPage = () => {
  const router = useRouter()
  const { toast } = useToast()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const createAiTechnology = useMutation(api.aiTechnologies.createAiTechnology)

  const form = useForm<z.infer<typeof aiTechnologySchema>>({
    resolver: zodResolver(aiTechnologySchema),
    defaultValues: {
      name: "",
      description: "",
      prompt: "",
      seed: "",
      negativePrompt: "",
      modelId: "",
      imageUrl: "",
    },
  })

  const isLoading = form.formState.isSubmitting

  async function onSubmit(values: z.infer<typeof aiTechnologySchema>) {
    try {
      setIsGenerating(true)
      const id = await createAiTechnology(values)
      toast({
        title: "AI Technology created!",
        description: "You've successfully created a new AI Technology.",
      })
      router.push(`/admin/ai-technologies/${id}`)
    } catch (error) {
      toast({
        title: "Something went wrong!",
        description: "There was an error creating the AI Technology.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = async (data: z.infer<typeof aiTechnologySchema>) => {
    try {
      setIsGenerating(true)
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
      } else {
        console.error("Failed to generate preview:", response.statusText)
        toast({
          title: "Something went wrong!",
          description: "There was an error generating the preview.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating preview:", error)
      toast({
        title: "Something went wrong!",
        description: "There was an error generating the preview.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create AI Technology</h1>
      </div>
      <Card className="w-[100%] space-y-4">
        <CardHeader>
          <CardTitle>AI Technology Information</CardTitle>
          <CardDescription>Enter the details for the new AI Technology.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="AI Technology Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of the AI Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter the prompt for the AI Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="negativePrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Negative Prompt</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter the negative prompt for the AI Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seed</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the seed for the AI Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="modelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the Model ID for the AI Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the Image URL for the AI Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={form.handleSubmit(handlePreview)}
                disabled={isLoading}
              >
                {isGenerating && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Preview
              </Button>

              {previewUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={previewUrl || "/placeholder.svg?height=400&width=800&text=Preview"}
                    alt="Preview"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      ;(e.target as any).src = "/placeholder.svg?height=400&width=800&text=Image+Not+Found"
                    }}
                  />
                </div>
              ) : (
                <Skeleton className="h-[400px] w-full" />
              )}

              <Button type="submit" disabled={isLoading}>
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AITechnologiesNewPage

