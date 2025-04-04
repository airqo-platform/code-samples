"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Navigation from "@/components/navigation/navigation"
import { DateRangePicker } from "@/components/DateRangePicker"
import { HistoricalDataChart } from "@/components/HistoricalDataChart"
import { HistoricalDataStats } from "@/components/HistoricalDataStats"
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card"
import { Button } from "@/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Loader2, RefreshCw, Download } from "lucide-react"
import { useToast } from "@/ui/use-toast"
import { getReportData } from "@/services/apiService"
import type { DateRange, HistoricalDataPoint, HistoricalDataResponse, SiteData } from "@/lib/types"

export default function HistoricalDataPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Get site_id from URL parameters
  const siteId = searchParams.get("siteId")
  const siteName = searchParams.get("siteName") || "Unknown Site"

  // State for date range
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    endDate: new Date(),
  })

  // State for historical data
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for available sites
  const [availableSites, setAvailableSites] = useState<SiteData[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(siteId)

  // Fetch available sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const data = await getReportData()
        if (data) {
          setAvailableSites(data)

          // If no siteId in URL, select the first site
          if (!siteId && data.length > 0) {
            setSelectedSiteId(data[0].site_id)
          }
        }
      } catch (err) {
        console.error("Failed to fetch sites:", err)
        toast({
          title: "Error",
          description: "Failed to load available sites",
          variant: "destructive",
        })
      }
    }

    fetchSites()
  }, [siteId, toast])

  // Fetch historical data when site or date range changes
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!selectedSiteId) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/historical-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            siteId: selectedSiteId,
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
          }),
        })

        const result: HistoricalDataResponse = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch historical data")
        }

        setHistoricalData(result.data)
      } catch (err) {
        console.error("Error fetching historical data:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to fetch historical data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistoricalData()
  }, [selectedSiteId, dateRange, toast])

  // Handle site change
  const handleSiteChange = (newSiteId: string) => {
    setSelectedSiteId(newSiteId)

    // Update URL without refreshing the page
    const url = new URL(window.location.href)
    url.searchParams.set("siteId", newSiteId)

    // Find site name
    const site = availableSites.find((site) => site.site_id === newSiteId)
    if (site) {
      url.searchParams.set("siteName", site.siteDetails.name)
    }

    window.history.pushState({}, "", url.toString())
  }

  // Handle refresh
  const handleRefresh = () => {
    // Re-fetch data with current parameters
    const fetchHistoricalData = async () => {
      if (!selectedSiteId) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/historical-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            siteId: selectedSiteId,
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
          }),
        })

        const result: HistoricalDataResponse = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch historical data")
        }

        setHistoricalData(result.data)

        toast({
          title: "Success",
          description: "Historical data refreshed successfully",
        })
      } catch (err) {
        console.error("Error fetching historical data:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to fetch historical data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistoricalData()
  }

  // Handle CSV export
  const handleExportCSV = () => {
    if (historicalData.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      })
      return
    }

    // Create CSV content
    const headers = ["Timestamp", "PM2.5 (µg/m³)", "PM10 (µg/m³)", "Temperature", "Humidity", "Site ID"]
    const rows = historicalData.map((point) => [
      point.timestamp,
      point.pm2_5,
      point.pm10,
      point.temperature || "",
      point.humidity || "",
      point.site_id,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `historical-data-${selectedSiteId}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "CSV file downloaded successfully",
    })
  }

  // Get current site name
  const getCurrentSiteName = () => {
    if (siteName && siteName !== "Unknown Site") return siteName

    const site = availableSites.find((site) => site.site_id === selectedSiteId)
    return site ? site.siteDetails.name : "Unknown Site"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Historical Data Analysis</h1>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <Select
              value={selectedSiteId || ""}
              onValueChange={handleSiteChange}
              disabled={isLoading || availableSites.length === 0}
            >
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {availableSites.map((site) => (
                  <SelectItem key={site.site_id} value={site.site_id}>
                    {site.siteDetails.name || site.siteDetails.formatted_name || "Unknown Site"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading || !selectedSiteId}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleExportCSV}
                disabled={isLoading || historicalData.length === 0}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Site info and date range */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Current Site</h3>
                <div className="text-lg font-semibold">{getCurrentSiteName()}</div>
                <div className="text-sm text-gray-500">Site ID: {selectedSiteId}</div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Date Range</h3>
                <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-lg text-blue-500">Loading historical data...</span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
            <p className="text-red-700">{error}</p>
            <Button
              variant="outline"
              className="mt-4 border-red-300 text-red-700 hover:bg-red-50"
              onClick={handleRefresh}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* No data state */}
        {!isLoading && !error && historicalData.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-center">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Data Available</h3>
            <p className="text-yellow-700">No historical data found for the selected site and date range.</p>
            <p className="text-yellow-600 mt-2">Try selecting a different date range or site.</p>
          </div>
        )}

        {/* Data visualization */}
        {!isLoading && !error && historicalData.length > 0 && (
          <div className="space-y-6">
            <HistoricalDataChart data={historicalData} title={`Air Quality Trends for ${getCurrentSiteName()}`} />

            <HistoricalDataStats
              data={historicalData}
              dateRange={{
                startDate: dateRange.startDate.toISOString(),
                endDate: dateRange.endDate.toISOString(),
              }}
            />

            
          </div>
        )}
      </div>
    </div>
  )
}

