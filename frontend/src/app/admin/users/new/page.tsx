"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NewUserPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "viewer",
    isActive: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setUser((prev) => ({ ...prev, role: value }))
  }

  const handleStatusChange = (checked: boolean) => {
    setUser((prev) => ({ ...prev, isActive: checked }))
  }

  const validateForm = () => {
    if (!user.username.trim()) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive",
      })
      return false
    }

    if (!user.email.trim() || !/\S+@\S+\.\S+/.test(user.email)) {
      toast({
        title: "Error",
        description: "Valid email is required",
        variant: "destructive",
      })
      return false
    }

    if (!user.password.trim() || user.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      })
      return false
    }

    if (user.password !== user.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSaving(true)

    try {
      // In a real implementation, this would call an API
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Success",
        description: "User created successfully",
      })

      router.push("/admin/users")
    } catch (error) {
      console.error("Failed to create user:", error)
      toast({
        title: "Error",
        description: "Failed to create user",
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
          <Link href="/admin/users">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">New User</h1>
        </div>
        <Button onClick={handleSubmit} disabled={isSaving} className="flex items-center gap-2">
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save User
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Add a new user to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={user.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={user.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={user.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={user.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <RadioGroup value={user.role} onValueChange={handleRoleChange} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="admin" id="admin" />
                    <Label htmlFor="admin" className="font-normal">
                      Admin (Full access to all features)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="editor" id="editor" />
                    <Label htmlFor="editor" className="font-normal">
                      Editor (Can create and edit content)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="viewer" id="viewer" />
                    <Label htmlFor="viewer" className="font-normal">
                      Viewer (Read-only access)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="isActive" checked={user.isActive} onCheckedChange={handleStatusChange} />
                <Label htmlFor="isActive">Active Account</Label>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">
            Users will receive an email notification when they are added to the system.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

