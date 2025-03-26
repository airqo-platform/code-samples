"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, FileText, BrainCircuit, ImageIcon, Settings, LogOut, Menu, X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { type User, canAccessFeature } from "@/lib/auth"

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  feature: "users" | "features" | "ai-technologies" | "media" | "settings"
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Skip authentication check for login page
  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    // Skip auth check if we're already on the login page
    if (isLoginPage) {
      setIsLoading(false)
      return
    }

    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/check")
        if (response.ok) {
          const data = await response.json()
          if (data.authenticated && data.user) {
            setCurrentUser(data.user)
            setIsAuthenticated(true)
          } else {
            // Redirect to login page if not authenticated
            router.push("/admin/login")
          }
        } else {
          // Redirect to login page if not authenticated
          router.push("/admin/login")
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/admin/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, isLoginPage, pathname])

  // Update the handleLogout function to properly handle the logout process
  const handleLogout = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setCurrentUser(null)
        setIsAuthenticated(false)
        router.push("/admin/login")
      } else {
        console.error("Logout failed: Server returned an error")
        toast({
          title: "Error",
          description: "Failed to log out, please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Logout failed:", error)
      toast({
        title: "Error",
        description: "Failed to log out, please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // If we're on the login page, just render the children without the admin layout
  if (isLoginPage) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isAuthenticated && !isLoginPage) {
    return null // Will redirect to login in useEffect
  }

  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" />, feature: "features" },
    { name: "Features", href: "/admin/features", icon: <FileText className="h-5 w-5" />, feature: "features" },
    {
      name: "AI Technologies",
      href: "/admin/ai-technologies",
      icon: <BrainCircuit className="h-5 w-5" />,
      feature: "ai-technologies",
    },
    { name: "Media Library", href: "/admin/media", icon: <ImageIcon className="h-5 w-5" />, feature: "media" },
    { name: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" />, feature: "users" },
    { name: "Settings", href: "/admin/settings", icon: <Settings className="h-5 w-5" />, feature: "settings" },
  ]

  // Filter nav items based on user access
  const allowedNavItems = navItems.filter((item) => currentUser && canAccessFeature(currentUser, item.feature))

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button variant="outline" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-white">
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-blue-600">AirQo Admin</h1>
            {currentUser && (
              <div className="text-sm text-gray-500 mt-2">
                <span className="font-medium capitalize">{currentUser.role}</span> · {currentUser.username}
              </div>
            )}
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {allowedNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <main className="p-6 md:p-8 min-h-screen">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}

