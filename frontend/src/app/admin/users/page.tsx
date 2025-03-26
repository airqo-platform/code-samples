"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, ArrowUpDown } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  username: string
  email: string
  role: "admin" | "editor" | "viewer"
  status: "active" | "inactive"
  lastLogin: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof User>("username")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const { toast } = useToast()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // In a real implementation, this would fetch from an API
        // For now, we'll simulate with static data
        const mockUsers: User[] = [
          {
            id: "1",
            username: "admin",
            email: "admin@example.com",
            role: "admin",
            status: "active",
            lastLogin: "2023-07-15T10:30:00Z",
          },
          {
            id: "2",
            username: "editor1",
            email: "editor@example.com",
            role: "editor",
            status: "active",
            lastLogin: "2023-07-14T15:45:00Z",
          },
          {
            id: "3",
            username: "viewer1",
            email: "viewer@example.com",
            role: "viewer",
            status: "active",
            lastLogin: "2023-07-10T09:20:00Z",
          },
          {
            id: "4",
            username: "inactive_user",
            email: "inactive@example.com",
            role: "editor",
            status: "inactive",
            lastLogin: null,
          },
        ]

        setUsers(mockUsers)
      } catch (error) {
        console.error("Failed to fetch users:", error)
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [toast])

  const handleSort = (field: keyof User) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return
    }

    try {
      // In a real implementation, this would call an API
      // Simulate API call
      setUsers((prev) => prev.filter((user) => user.id !== id))
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const fieldA = a[sortField]
    const fieldB = b[sortField]

    if (fieldA === null && fieldB !== null) return sortDirection === "asc" ? -1 : 1
    if (fieldA !== null && fieldB === null) return sortDirection === "asc" ? 1 : -1
    if (fieldA === null && fieldB === null) return 0

    if (typeof fieldA === "string" && typeof fieldB === "string") {
      return sortDirection === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
    }

    return 0
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "editor":
        return "default"
      case "viewer":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Users</h1>
        <Link href="/admin/users/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New User
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>View and manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search users..."
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
                  <TableHead className="cursor-pointer" onClick={() => handleSort("username")}>
                    <div className="flex items-center">
                      Username
                      {sortField === "username" && <ArrowUpDown size={14} className="ml-2" />}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                    <div className="flex items-center">
                      Email
                      {sortField === "email" && <ArrowUpDown size={14} className="ml-2" />}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("role")}>
                    <div className="flex items-center">
                      Role
                      {sortField === "role" && <ArrowUpDown size={14} className="ml-2" />}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                    <div className="flex items-center">
                      Status
                      {sortField === "status" && <ArrowUpDown size={14} className="ml-2" />}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("lastLogin")}>
                    <div className="flex items-center">
                      Last Login
                      {sortField === "lastLogin" && <ArrowUpDown size={14} className="ml-2" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === "active" ? "outline" : "secondary"}>{user.status}</Badge>
                      </TableCell>
                      <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/users/edit/${user.id}`}>
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleDeleteUser(user.id)}
                          >
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
            Showing {sortedUsers.length} of {users.length} users
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

