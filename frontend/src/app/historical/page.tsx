"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Navigation from "@/components/navigation/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/card"
import { Button } from "@/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Loader2, RefreshCw, Download, Printer, Calendar, Check, X, BarChart3 } from "lucide-react"
import { useToast } from "@/ui/use-toast"
import { getReportData } from "@/services/apiService"
import type { SiteData } from "@/lib/types"
import { DateRangePicker } from "@/components/date-range-picker"
import { HistoricalDataStats } from "@/components/HistoricalDataStats"
import { fetchHistoricalDataBySiteId, mockHistoricalData } from "@/services/bigQueryService"
import type { BigQueryMeasurement } from "@/services/bigQueryService"
import { Checkbox } from "@/ui/checkbox"
import { Input } from "@/ui/input"
import { Label } from "@/ui/label"
import { format, differenceInDays, addDays, subDays } from "date-fns"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function HistoricalDataPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const reportRef = useRef<HTMLDivElement>(null)

  // Get site_id from URL parameters
  const siteId = searchParams.get("siteId")
  const siteName = searchParams.get("siteName") || "Unknown Site"

  // State for date range
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
  const [endDate, setEndDate] = useState<Date>(new Date())

  // State for historical data
  const [data, setData] = useState<BigQueryMeasurement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // State for available sites
  const [siteData, setSiteData] = useState<SiteData[]>([])
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>(siteId ? [siteId] : [])

  // State for site filtering
  const [countries, setCountries] = useState<string[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  // State for site search and selection
  const [siteSearch, setSiteSearch] = useState<string>("")
  const [filteredSites, setFilteredSites] = useState<SiteData[]>([])

  // State for report
  const [showReportOnPage, setShowReportOnPage] = useState<boolean>(false)
  const [selectedVisualization, setSelectedVisualization] = useState<string>("chart")

  // Add state for advanced analysis options
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [analysisType, setAnalysisType] = useState<"moran" | "getis">("moran")

  // Add a ref to track initial render
  const isInitialRender = useRef(true)

  // Fetch available sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setIsLoading(true)
        const data = await getReportData()
        if (data) {
          setSiteData(data)

          // Extract unique countries
          const uniqueCountries = Array.from(new Set(data.map((site) => site.siteDetails?.country || "Unknown")))
            .filter(Boolean)
            .sort()
          setCountries(uniqueCountries)

          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(
              data.map((site) => {
                const category = site.siteDetails?.site_category?.category || "Uncategorized"
                return category === "Water Body" ? "Urban Background" : category
              }),
            ),
          )
            .filter(Boolean)
            .sort()
          setCategories(uniqueCategories)

          // If no siteId in URL but one was provided in the URL
          if (siteId && !selectedSiteIds.includes(siteId)) {
            setSelectedSiteIds([siteId])
          }
        }
      } catch (err) {
        console.error("Failed to fetch sites:", err)
        toast({
          title: "Error",
          description: "Failed to load available sites",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSites()
  }, [siteId, toast, selectedSiteIds])

  // Update cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      const sitesByCountry = siteData.filter((site) => site.siteDetails?.country === selectedCountry)
      const uniqueCities = Array.from(new Set(sitesByCountry.map((site) => site.siteDetails?.city || "Unknown")))
        .filter(Boolean)
        .sort()
      setCities(uniqueCities)
    } else {
      setCities([])
      // Only reset city selection when country changes, not when selecting sites
      setSelectedCity("")
    }
  }, [selectedCountry, siteData])

  // Update filtered sites based on search and filters
  useEffect(() => {
    let filtered = [...siteData]

    // Apply country filter
    if (selectedCountry && selectedCountry !== "all") {
      filtered = filtered.filter((site) => site.siteDetails?.country === selectedCountry)
    }

    // Apply city filter
    if (selectedCity && selectedCity !== "all") {
      filtered = filtered.filter((site) => site.siteDetails?.city === selectedCity)
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter((site) => {
        const category = site.siteDetails?.site_category?.category || "Uncategorized"
        if (selectedCategory === "Urban Background") {
          return category === "Urban Background" || category === "Water Body"
        }
        return category === selectedCategory
      })
    }

    // Apply search
    if (siteSearch) {
      const search = siteSearch.toLowerCase()
      filtered = filtered.filter(
        (site) =>
          (site.siteDetails?.name || "").toLowerCase().includes(search) ||
          (site.siteDetails?.formatted_name || "").toLowerCase().includes(search) ||
          (site.siteDetails?.city || "").toLowerCase().includes(search) ||
          (site.siteDetails?.country || "").toLowerCase().includes(search),
      )
    }

    setFilteredSites(filtered)
  }, [siteData, selectedCountry, selectedCity, selectedCategory, siteSearch])

  // Validate date range to ensure it's not more than 120 days
  const validateDateRange = (start: Date, end: Date): boolean => {
    const daysDifference = differenceInDays(end, start)

    if (daysDifference > 120) {
      toast({
        title: "Date Range Too Large",
        description: "Please select a date range of 120 days or less.",
        variant: "destructive",
      })

      // Adjust end date to be 120 days from start
      setEndDate(addDays(start, 120))
      return false
    }

    if (daysDifference < 0) {
      toast({
        title: "Invalid Date Range",
        description: "End date must be after start date.",
        variant: "destructive",
      })

      // Reset to a valid 7-day range
      setStartDate(subDays(new Date(), 7))
      setEndDate(new Date())
      return false
    }

    return true
  }

  // Fetch historical data
  const fetchData = async () => {
    if (selectedSiteIds.length === 0) {
      toast({
        title: "No Sites Selected",
        description: "Please select at least one site to fetch data.",
        variant: "destructive",
      })
      return
    }

    if (!validateDateRange(startDate, endDate)) {
      return
    }

    setIsLoading(true)
    setError(null)
    setData([])

    try {
      let allData: BigQueryMeasurement[] = []

      // Fetch data for each selected site
      for (const siteId of selectedSiteIds) {
        let siteData

        // Check if we're in development mode and should use mock data
        if (process.env.NODE_ENV === "development" && !process.env.BIGQUERY_DATASET_ID) {
          console.log("Using mock data for development")
          const response = mockHistoricalData(siteId, startDate, endDate)
          siteData = response.measurements
        } else {
          // Use the actual API call with BigQuery
          const response = await fetchHistoricalDataBySiteId(siteId, startDate, endDate)
          siteData = response.measurements
        }

        allData = [...allData, ...siteData]
      }

      setData(allData)

      if (allData.length === 0) {
        toast({
          title: "No Data Available",
          description: "No historical data found for the selected site(s) and date range.",
        })
      } else {
        toast({
          title: "Data Loaded",
          description: `Successfully loaded ${allData.length} data points.`,
        })
      }
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

  // Handle date range change
  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start)
    setEndDate(end)

    // Only fetch data if sites are selected
    if (selectedSiteIds.length > 0) {
      // Use setTimeout to ensure state updates before fetching
      setTimeout(() => {
        fetchData()
      }, 0)
    } else {
      toast({
        title: "No Sites Selected",
        description: "Please select at least one site before changing date range.",
        variant: "warning",
      })
    }
  }

  // Handle site selection
  const toggleSiteSelection = (siteId: string) => {
    setSelectedSiteIds((prev) => (prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]))
  }

  // Handle CSV export
  const handleExportCSV = () => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      })
      return
    }

    // Create CSV content
    const headers = ["Timestamp", "PM2.5 (µg/m³)", "PM10 (µg/m³)", "Temperature", "Humidity", "Site ID"]
    const rows = data.map((point) => [
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
    a.download = `historical-data-${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "CSV file downloaded successfully",
    })
  }

  // Generate PDF report
  const generatePDF = async () => {
    if (!reportRef.current || data.length === 0) {
      toast({
        title: "Cannot Generate PDF",
        description: "No data available or report not ready",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingPDF(true)

    try {
      const reportElement = reportRef.current

      // Scale for better quality (but not too high to avoid memory issues)
      const canvas = await html2canvas(reportElement, {
        scale: 1.5,
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      const imgData = canvas.toDataURL("image/png", 0.7)

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      })

      // Define margins
      const pageWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const marginLeft = 15
      const marginRight = 15
      const marginTop = 20
      const marginBottom = 25

      const contentWidth = pageWidth - marginLeft - marginRight
      const contentHeight = pageHeight - marginTop - marginBottom

      const imgWidth = contentWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Calculate how many pages we'll need
      const totalPages = Math.ceil(imgHeight / contentHeight)

      // Function to add page number
      const addPageNumber = (pageNum: number) => {
        pdf.setFontSize(9)
        pdf.setTextColor(100, 100, 100)
        pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" })
      }

      // Add first page with margins
      pdf.addImage(imgData, "PNG", marginLeft, marginTop, imgWidth, imgHeight)
      addPageNumber(1)

      let heightLeft = imgHeight - contentHeight
      let position = marginTop - contentHeight
      let pageCount = 1

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        // Add a new page
        pdf.addPage()
        pageCount++

        // Calculate position for next page
        position = marginTop - pageHeight * (pageCount - 1)

        pdf.addImage(imgData, "PNG", marginLeft, position, imgWidth, imgHeight)
        addPageNumber(pageCount)

        heightLeft -= contentHeight
      }

      // Generate filename
      const sitesInfo =
        selectedSiteIds.length > 1 ? `multiple-sites-${selectedSiteIds.length}` : `site-${selectedSiteIds[0]}`

      const filename = `historical-data-${sitesInfo}-${format(new Date(), "yyyy-MM-dd")}`

      pdf.save(`${filename}.pdf`)

      toast({
        title: "Success",
        description: "PDF report generated successfully",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Get site names as a string
  const getSiteNames = (): string => {
    if (selectedSiteIds.length === 0) return "No Sites Selected"

    const siteNames = selectedSiteIds.map((id) => {
      const site = siteData.find((s) => s._id === id)
      return site ? site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown" : id
    })

    if (siteNames.length === 1) return siteNames[0]

    if (siteNames.length <= 3) return siteNames.join(", ")

    return `${siteNames.slice(0, 2).join(", ")} and ${siteNames.length - 2} more`
  }

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedSiteIds([])
    setSelectedCountry("")
    setSelectedCity("")
    setSelectedCategory("")
    setSiteSearch("")
  }

  // Reset date range to last 7 days
  const resetDateRange = () => {
    setStartDate(subDays(new Date(), 7))
    setEndDate(new Date())

    // Only fetch data if sites are selected
    if (selectedSiteIds.length > 0) {
      // Use setTimeout to ensure state updates before fetching
      setTimeout(() => {
        fetchData()
      }, 0)
    }
  }

  // Add a function to select all filtered sites
  const selectAllFilteredSites = () => {
    const filteredSiteIds = filteredSites.map((site) => site._id)
    setSelectedSiteIds(filteredSiteIds)

    toast({
      title: "Sites Selected",
      description: `Selected ${filteredSiteIds.length} sites`,
    })
  }

  // Calculate average PM values by site
  const calculateSiteAverages = () => {
    if (data.length === 0) return []

    // Group data by site_id
    const siteGroups = data.reduce(
      (groups, item) => {
        const key = item.site_id
        if (!groups[key]) {
          groups[key] = []
        }
        groups[key].push(item)
        return groups
      },
      {} as Record<string, BigQueryMeasurement[]>,
    )

    // Calculate averages for each site
    return Object.entries(siteGroups).map(([siteId, measurements]) => {
      const siteName = getSiteName(siteId)
      const pm25Values = measurements.map((m) => m.pm2_5)
      const pm10Values = measurements.map((m) => m.pm10)

      // Calculate averages
      const avgPm25 = pm25Values.reduce((sum, val) => sum + val, 0) / pm25Values.length
      const avgPm10 = pm10Values.reduce((sum, val) => sum + val, 0) / pm10Values.length

      // Calculate trends (first half vs second half of the period)
      const halfIndex = Math.floor(pm25Values.length / 2)
      const firstHalfPm25 = pm25Values.slice(0, halfIndex)
      const secondHalfPm25 = pm25Values.slice(halfIndex)

      const firstHalfAvgPm25 = firstHalfPm25.reduce((sum, val) => sum + val, 0) / firstHalfPm25.length
      const secondHalfAvgPm25 = secondHalfPm25.reduce((sum, val) => sum + val, 0) / secondHalfPm25.length

      // Calculate percentage change
      let percentChange = 0
      if (firstHalfAvgPm25 > 0) {
        percentChange = ((secondHalfAvgPm25 - firstHalfAvgPm25) / firstHalfAvgPm25) * 100
      }

      return {
        siteId,
        siteName,
        avgPm25,
        avgPm10,
        percentChange,
      }
    })
  }

  // Get site name from site ID
  const getSiteName = (siteId: string): string => {
    const site = siteData.find((s) => s._id === siteId)
    return site ? site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown" : siteId
  }

  // Prepare data for bar chart
  const siteAverages = calculateSiteAverages()

  const barChartData = {
    labels: siteAverages.map((site) => site.siteName),
    datasets: [
      {
        label: "PM2.5 (µg/m³)",
        data: siteAverages.map((site) => site.avgPm25),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        borderColor: "rgba(53, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "PM10 (µg/m³)",
        data: siteAverages.map((site) => site.avgPm10),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Average PM Values by Site",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          afterLabel: (context: any) => {
            const index = context.dataIndex
            const percentChange = siteAverages[index]?.percentChange.toFixed(1)
            return `Trend: ${percentChange}% change over period`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Concentration (µg/m³)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Monitoring Sites",
        },
      },
    },
  }

  // Add a useEffect to automatically fetch data when selectedSiteIds or date range changes
  // Add this after the other useEffect hooks
  useEffect(() => {
    // Only fetch data if there are selected sites and we're not already loading
    if (selectedSiteIds.length > 0 && !isLoading) {
      // Don't fetch on initial render, only when dependencies change

      if (isInitialRender.current) {
        isInitialRender.current = false
        return
      }

      // Validate date range before fetching
      if (validateDateRange(startDate, endDate)) {
        fetchData()
      }
    }
  }, [selectedSiteIds, startDate, endDate])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Historical Data Analysis</h1>
            <p className="text-gray-600">Analyze historical air quality data across multiple sites</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowReportOnPage(!showReportOnPage)}
              className="flex items-center gap-2"
              disabled={data.length === 0}
            >
              {showReportOnPage ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {showReportOnPage ? "Hide Report" : "View Report"}
            </Button>

            <Button
              variant="outline"
              onClick={fetchData}
              className="flex items-center gap-2"
              disabled={isLoading || selectedSiteIds.length === 0}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Site Selection */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Site Selection</CardTitle>
              <CardDescription>Select sites by country, city, or category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="country-select">Country</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger id="country-select">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="city-select">City</Label>
                    <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedCountry}>
                      <SelectTrigger id="city-select">
                        <SelectValue placeholder={selectedCountry ? "Select city" : "Select country first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category-select">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category-select">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Search */}
                <div>
                  <Label htmlFor="site-search">Search Sites</Label>
                  <Input
                    id="site-search"
                    placeholder="Search by name, city, or country"
                    value={siteSearch}
                    onChange={(e) => setSiteSearch(e.target.value)}
                    className="mb-2"
                  />
                </div>

                {/* Results Counter */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Showing {filteredSites.length} of {siteData.length} sites
                  </div>
                  <div className="text-sm text-gray-500">{selectedSiteIds.length} sites selected</div>
                </div>

                {/* Site List */}
                <div className="max-h-60 overflow-y-auto border rounded-md bg-white">
                  {filteredSites.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No sites match your filters</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                      {filteredSites.slice(0, 20).map((site) => (
                        <div
                          key={site._id}
                          className={`flex items-center space-x-2 p-2 border rounded-md ${
                            selectedSiteIds.includes(site._id) ? "border-blue-500 bg-blue-50" : ""
                          }`}
                        >
                          <Checkbox
                            id={`site-${site._id}`}
                            checked={selectedSiteIds.includes(site._id)}
                            onCheckedChange={() => toggleSiteSelection(site._id)}
                          />
                          <Label
                            htmlFor={`site-${site._id}`}
                            className="flex-1 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
                          >
                            {site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"}
                            <span className="text-xs text-gray-500 ml-1">
                              ({site.siteDetails?.city || "Unknown"}, {site.siteDetails?.country || "Unknown"})
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {filteredSites.length > 20 && (
                  <div className="text-center text-sm text-blue-600">
                    Showing top 20 results. Refine your search to see more specific sites.
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={clearAllSelections}>
                      Clear All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllFilteredSites}
                      disabled={filteredSites.length === 0}
                    >
                      Select All ({filteredSites.length})
                    </Button>
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={fetchData}
                    disabled={selectedSiteIds.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Get Historical Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Range Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Date Range</CardTitle>
              <CardDescription>Select a time period (max 120 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <DateRangePicker
                  onUpdate={({ from, to }) => {
                    if (from && to) {
                      handleDateRangeChange(from, to)
                    }
                  }}
                  initialDateFrom={startDate}
                  initialDateTo={endDate}
                  maxDate={new Date()}
                  maxRange={120}
                />

                <div className="text-sm text-gray-500 flex justify-between items-center">
                  <span>Selected: {differenceInDays(endDate, startDate)} days</span>
                  <Button variant="outline" size="sm" onClick={resetDateRange}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Reset to Last 7 Days
                  </Button>
                </div>

                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
                  <p>
                    <strong>Note:</strong> Maximum time range is limited to 120 days for performance reasons.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Sites Summary */}
        {selectedSiteIds.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-medium text-blue-800">Selected Sites:</span>
              <div className="flex flex-wrap gap-2">
                {selectedSiteIds.map((id) => {
                  const site = siteData.find((s) => s._id === id)
                  const name = site ? site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown" : id

                  return (
                    <div
                      key={id}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {name}
                      <button onClick={() => toggleSiteSelection(id)} className="text-blue-600 hover:text-blue-800">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

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
            <Button variant="outline" className="mt-4 border-red-300 text-red-700 hover:bg-red-50" onClick={fetchData}>
              Try Again
            </Button>
          </div>
        )}

        {/* No data state */}
        {!isLoading && !error && data.length === 0 && selectedSiteIds.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-center">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Data Available</h3>
            <p className="text-yellow-700">No historical data found for the selected site(s) and date range.</p>
            <p className="text-yellow-600 mt-2">Try selecting a different date range or site.</p>
          </div>
        )}

        {/* Report Actions */}
        {!isLoading && !error && data.length > 0 && (
          <div className="flex justify-end gap-2 mb-6">
            <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>

            <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <Button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        )}

        {/* Bar Chart Visualization */}
        {!isLoading && !error && data.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center">
              <div>
                <CardTitle>Site Comparison</CardTitle>
                <CardDescription>Average PM values by site with trend analysis</CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 ml-2 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <Bar data={barChartData} options={barChartOptions} />
              </div>

              {/* Trend Analysis Table */}
              <div className="mt-6 overflow-x-auto">
                <h3 className="text-lg font-semibold mb-3">Trend Analysis</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Site
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Avg PM2.5 (µg/m³)
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Avg PM10 (µg/m³)
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Trend (% Change)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {siteAverages.map((site) => (
                      <tr key={site.siteId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {site.siteName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{site.avgPm25.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{site.avgPm10.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              site.percentChange > 0
                                ? "bg-red-100 text-red-800"
                                : site.percentChange < 0
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {site.percentChange > 0 ? "+" : ""}
                            {site.percentChange.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 bg-blue-50 p-4 rounded-md text-sm">
                <h4 className="font-semibold text-blue-800 mb-1">About the Trend Analysis</h4>
                <p className="text-blue-700">
                  The trend shows the percentage change in PM2.5 levels from the first half to the second half of the
                  selected time period. A negative value (green) indicates improving air quality, while a positive value
                  (red) indicates worsening air quality.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report and Visualization */}
        {showReportOnPage && !isLoading && !error && data.length > 0 && (
          <div ref={reportRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 mb-8">
            {/* Report Header */}
            <div className="text-center mb-6 border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800">Air Quality Historical Data Report</h2>
              <p className="text-gray-600 mt-2">{getSiteNames()}</p>
              <p className="text-gray-500 mt-1">
                Report Period: {format(startDate, "MMMM d, yyyy")} to {format(endDate, "MMMM d, yyyy")}
              </p>
            </div>

            {/* Report Content */}
            <div className="space-y-6">
              {/* Introduction */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Introduction</h3>
                <p className="text-gray-700">
                  This report provides an analysis of historical air quality data for{" "}
                  {selectedSiteIds.length === 1 ? "the selected site" : `${selectedSiteIds.length} selected sites`}
                  covering the period from {format(startDate, "MMMM d, yyyy")} to {format(endDate, "MMMM d, yyyy")}. The
                  data includes measurements of particulate matter (PM2.5 and PM10) concentrations in micrograms per
                  cubic meter (µg/m³).
                  {data[0]?.temperature ? " Temperature and humidity data are also included where available." : ""}
                </p>
              </div>

              {/* Bar Chart Visualization */}
              <div className="h-[400px] w-full">
                <Bar data={barChartData} options={barChartOptions} />
              </div>

              {/* Analysis */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
                <h3 className="font-semibold text-gray-800 mb-2">Key Findings</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {siteAverages.map((site) => (
                    <li key={site.siteId}>
                      <strong>{site.siteName}:</strong> Average PM2.5: {site.avgPm25.toFixed(1)} µg/m³, PM10:{" "}
                      {site.avgPm10.toFixed(1)} µg/m³, Trend:{" "}
                      <span
                        className={
                          site.percentChange > 0
                            ? "text-red-600"
                            : site.percentChange < 0
                              ? "text-green-600"
                              : "text-gray-600"
                        }
                      >
                        {site.percentChange > 0 ? "+" : ""}
                        {site.percentChange.toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Recommendations</h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Actions Based on Air Quality Findings</h4>
                  <ul className="list-disc list-inside text-blue-700 space-y-2">
                    {siteAverages.some((site) => site.avgPm25 > 35) ? (
                      <>
                        <li>
                          Consider implementing exposure reduction measures in areas with consistently high PM2.5 values
                          (above 35 µg/m³).
                        </li>
                        <li>
                          Increase monitoring frequency in high pollution areas to establish more detailed patterns.
                        </li>
                        <li>Investigate potential pollution sources near monitoring sites with peak values.</li>
                      </>
                    ) : (
                      <>
                        <li>
                          Maintain current monitoring schedule as PM2.5 levels appear to be within acceptable ranges.
                        </li>
                        <li>Continue to monitor trends to identify any potential seasonal variations.</li>
                      </>
                    )}
                    <li>Compare findings with regional air quality trends to identify local pollution sources.</li>
                    {siteAverages.some((site) => site.percentChange > 10) && (
                      <li>
                        Investigate sites showing significant increasing trends (>10%) to identify potential new
                        pollution sources.
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="text-xs text-gray-500 border-t pt-4 mt-6">
                <p>
                  Report generated on {format(new Date(), "MMMM d, yyyy")} at {format(new Date(), "h:mm a")}.
                </p>
                <p>
                  Data is based on readings from the AirQo monitoring network. For more information, visit airqo.net.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Data visualization when not showing full report */}
        {!showReportOnPage && !isLoading && !error && data.length > 0 && (
          <div className="space-y-6">
            <HistoricalDataStats data={data} siteName={selectedSiteIds.length === 1 ? getSiteNames() : undefined} />
          </div>
        )}
      </div>
    </div>
  )
}

