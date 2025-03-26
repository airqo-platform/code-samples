"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { FileText, BrainCircuit, ImageIcon, Settings, Eye } from "lucide-react"
import { Button } from "@/ui/button"

interface DashboardStats {
  features: number
  aiTechnologies: number
  mediaItems: number
  lastUpdated: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    features: 0,
    aiTechnologies: 0,
    mediaItems: 0,
    lastUpdated: "",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // In a real implementation, this would fetch from an API
        // For now, we'll simulate with static data
        setStats({
          features: 6,
          aiTechnologies: 5,
          mediaItems: 12,
          lastUpdated: new Date().toLocaleString(),
        })
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link href="/" target="_blank">
          <Button variant="outline" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Site
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Features"
          value={stats.features}
          icon={<FileText className="h-8 w-8 text-blue-500" />}
          href="/admin/features"
        />
        <DashboardCard
          title="AI Technologies"
          value={stats.aiTechnologies}
          icon={<BrainCircuit className="h-8 w-8 text-purple-500" />}
          href="/admin/ai-technologies"
        />
        <DashboardCard
          title="Media Items"
          value={stats.mediaItems}
          icon={<ImageIcon className="h-8 w-8 text-green-500" />}
          href="/admin/media"
        />
        <DashboardCard
          title="Settings"
          description="Site Configuration"
          icon={<Settings className="h-8 w-8 text-gray-500" />}
          href="/admin/settings"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/admin/features/new">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Add New Feature
                </Button>
              </Link>
              <Link href="/admin/ai-technologies/new">
                <Button variant="outline" className="w-full justify-start">
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  Add AI Technology
                </Button>
              </Link>
              <Link href="/admin/media/upload">
                <Button variant="outline" className="w-full justify-start">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Upload Media
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Update Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Current status and information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">Last Updated</span>
                <span>{stats.lastUpdated}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">Environment</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Production</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">API Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface DashboardCardProps {
  title: string
  value?: number
  description?: string
  icon: React.ReactNode
  href: string
}

function DashboardCard({ title, value, description, icon, href }: DashboardCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">{icon}</div>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-medium">{title}</h3>
          {value !== undefined ? (
            <p className="text-3xl font-bold">{value}</p>
          ) : (
            <p className="text-gray-500">{description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

