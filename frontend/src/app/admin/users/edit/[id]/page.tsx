"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  username: string
  email: string
  role: "admin" | "editor" | "viewer"
  isActive: boolean
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetingPassword, setIsResetingPassword] = useState(false)
  const [user, setUser] = useState<User>({
    id: "",
    username: "",
    email: "",
    role: "viewer",
    isActive: true,
  })
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // In a real implementation, this would fetch from an API
        // For now, we'll simulate with static data based on ID
        const userId = params.id as string

        // Mock user data
        const mockUserData: Record<string, User> = {
          "1": {
            id: "1",
            username: "admin",
            email: "admin@example.com",
            role: "admin",
            isActive: true,
          },
          "2": {
            id: "2",
            username: "editor1",
            email: "editor@example.com",
            role: "editor",
            isActive: true,
          },
          "3": {
            id: "3",
            username: "viewer1",
            email: "viewer@example.com",
            role: "viewer",
            isActive: true,
          },
          "4": {
            id: "4",
            username: "inactive_user",
            email: "inactive@example.com",
            role: "editor",
            isActive: false,
          },
        }

        const userData = mockUserData[userId]

        if (!userData) {
          toast({
            title: "Error",
            description: "User not found",
            variant: "destructive",
          })
          router.push("/admin/users")
          return
        }

        setUser(userData)
      } catch (error) {
        console.error("Failed to fetch user:", error)
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [params.id, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setUser((prev) => ({ ...prev, role: value as "admin" | "editor" | "viewer" }))
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

    if (isResetingPassword) {
      if (!newPassword.trim() || newPassword.length < 8) {
        toast({
          title: "Error",
          description: "New password must be at least 8 characters",
          variant: "destructive",
        })
        return false
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        })
        return false
      }
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

      // Build payload to send to API
      const payload = {
        ...user,
        ...(isResetingPassword ? { password: newPassword } : {}),
      }

      console.log("Saving user with payload:", payload)

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      // Reset password fields
      setIsResetingPassword(false)
      setNewPassword("")
      setConfirmPassword("")

      router.push("/admin/users")
    } catch (error) {
      console.error("Failed to update user:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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
        <div className="flex items-center gap-2">
          <Link href="/admin/users">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit User</h1>
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
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Edit user details and permissions</CardDescription>
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

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Password</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsResetingPassword(!isResetingPassword)}
                    className="flex items-center gap-1"
                  >
                    <Lock className="h-3 w-3" />
                    {isResetingPassword ? "Cancel Reset" : "Reset Password"}
                  </Button>
                </div>

                {isResetingPassword && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                )}
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
          <p className="text-sm text-gray-500">Last login: {user.isActive ? "2023-07-15" : "Never"}</p>
        </CardFooter>
      </Card>
    </div>
  )
}

