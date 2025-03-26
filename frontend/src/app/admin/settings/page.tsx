"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Save, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SiteSettings {
  general: {
    siteName: string
    siteDescription: string
    contactEmail: string
    contactPhone: string
    address: string
  }
  seo: {
    metaTitle: string
    metaDescription: string
    googleAnalyticsId: string
    enableSitemap: boolean
  }
  api: {
    apiUrl: string
    apiToken: string
  }
  advanced: {
    maintenanceMode: boolean
    debugMode: boolean
    cacheTimeout: number
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    general: {
      siteName: "AirQo AI",
      siteDescription: "AI-Powered Air Quality Monitoring",
      contactEmail: "info@airqo.net",
      contactPhone: "+256 786 142 396",
      address:
        "Makerere University, Software Systems Centre, Block B, Level 3, College of Computing and Information Sciences, Plot 56 University Pool Road, Kampala, Uganda",
    },
    seo: {
      metaTitle: "AirQo AI | Air Quality Monitoring",
      metaDescription:
        "AirQo AI provides advanced tools for monitoring, analyzing, and optimizing air quality across African cities using artificial intelligence.",
      googleAnalyticsId: "",
      enableSitemap: true,
    },
    api: {
      apiUrl: "",
      apiToken: "",
    },
    advanced: {
      maintenanceMode: false,
      debugMode: false,
      cacheTimeout: 3600,
    },
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // In a real implementation, this would fetch from an API
        // For now, we'll simulate with static data

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Update with environment variables if available
        setSettings((prev) => ({
          ...prev,
          seo: {
            ...prev.seo,
            googleAnalyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || prev.seo.googleAnalyticsId,
          },
          api: {
            apiUrl: process.env.NEXT_PUBLIC_API_URL || prev.api.apiUrl,
            apiToken: process.env.NEXT_PUBLIC_API_TOKEN || prev.api.apiToken,
          },
        }))
      } catch (error) {
        console.error("Failed to fetch settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        [name]: value,
      },
    }))
  }

  const handleSeoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [name]: value,
      },
    }))
  }

  const handleSeoSwitchChange = (checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        enableSitemap: checked,
      },
    }))
  }

  const handleApiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      api: {
        ...prev.api,
        [name]: value,
      },
    }))
  }

  const handleAdvancedSwitchChange = (name: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        [name]: checked,
      },
    }))
  }

  const handleAdvancedNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        [name]: Number.parseInt(value) || 0,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // In a real implementation, this would save to an API
      console.log("Saving settings:", settings)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully",
      })
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
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
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button className="flex items-center gap-2" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic information about your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    name="siteName"
                    value={settings.general.siteName}
                    onChange={handleGeneralChange}
                    placeholder="Your site name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    name="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={handleGeneralChange}
                    placeholder="Brief description of your site"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={handleGeneralChange}
                    placeholder="contact@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    value={settings.general.contactPhone}
                    onChange={handleGeneralChange}
                    placeholder="+1 234 567 890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={settings.general.address}
                    onChange={handleGeneralChange}
                    placeholder="Your physical address"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Search engine optimization settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Default Meta Title</Label>
                  <Input
                    id="metaTitle"
                    name="metaTitle"
                    value={settings.seo.metaTitle}
                    onChange={handleSeoChange}
                    placeholder="Default page title"
                  />
                  <p className="text-xs text-gray-500">Recommended length: 50-60 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Default Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={settings.seo.metaDescription}
                    onChange={handleSeoChange}
                    placeholder="Default page description"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">Recommended length: 150-160 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                  <Input
                    id="googleAnalyticsId"
                    name="googleAnalyticsId"
                    value={settings.seo.googleAnalyticsId}
                    onChange={handleSeoChange}
                    placeholder="GA-XXXXXXXXXX"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableSitemap"
                    checked={settings.seo.enableSitemap}
                    onCheckedChange={handleSeoSwitchChange}
                  />
                  <Label htmlFor="enableSitemap">Enable XML Sitemap</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription>Configure API connections for your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input
                    id="apiUrl"
                    name="apiUrl"
                    value={settings.api.apiUrl}
                    onChange={handleApiChange}
                    placeholder="https://api.example.com"
                  />
                  <p className="text-xs text-gray-500">The base URL for API requests</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiToken">API Token</Label>
                  <Input
                    id="apiToken"
                    name="apiToken"
                    type="password"
                    value={settings.api.apiToken}
                    onChange={handleApiChange}
                    placeholder="Your API token"
                  />
                  <p className="text-xs text-gray-500">Authentication token for API requests</p>
                </div>

                <div className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => {
                      toast({
                        title: "API Connection Tested",
                        description: "Connection successful",
                      })
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Advanced configuration options for your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenanceMode"
                    checked={settings.advanced.maintenanceMode}
                    onCheckedChange={(checked) => handleAdvancedSwitchChange("maintenanceMode", checked)}
                  />
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="debugMode"
                    checked={settings.advanced.debugMode}
                    onCheckedChange={(checked) => handleAdvancedSwitchChange("debugMode", checked)}
                  />
                  <Label htmlFor="debugMode">Debug Mode</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cacheTimeout">Cache Timeout (seconds)</Label>
                  <Input
                    id="cacheTimeout"
                    name="cacheTimeout"
                    type="number"
                    min="0"
                    value={settings.advanced.cacheTimeout}
                    onChange={handleAdvancedNumberChange}
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => {
                      toast({
                        title: "Cache Cleared",
                        description: "Website cache has been cleared successfully",
                      })
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Clear Cache
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-gray-500">
                  Warning: Changes to these settings may affect website performance.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}

