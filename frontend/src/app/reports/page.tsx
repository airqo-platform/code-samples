"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card"
import { BarChart3, HeartPulse, Globe, ArrowDown, ArrowUp, Minus, Download, Printer } from "lucide-react"
import Navigation from "@/components/navigation/navigation"
import type { ReactNode } from "react"
import { getReportData } from "@/services/apiService"
import { Skeleton } from "@/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Button } from "@/ui/button"
import type { SiteData, Filters } from "@/lib/types"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { format } from "date-fns"
import {
  PM25BarChart,
  AQICategoryChart,
  WeeklyComparisonChart,
  AQIIndexVisual,
} from "@/components/charts/AirQualityChart"
import { Input } from "@/ui/input"
import { Checkbox } from "@/ui/checkbox"

// Add these imports at the top of the file
import { Zap, Layers, BrainCircuit } from "lucide-react"
import { Switch } from "@/ui/switch"
import { Label } from "@/ui/label"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"

export default function ReportPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navigation />
      <ReportContent />
    </div>
  )
}

function ReportContent() {
  // Add this state at the top of the ReportContent function, near the other state declarations
  const [activeTab, setActiveTab] = useState("moran")
  const [siteData, setSiteData] = useState<SiteData[]>([])
  const [filteredData, setFilteredData] = useState<SiteData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // Add a state to control whether the report is visible on the page
  const [showReportOnPage, setShowReportOnPage] = useState(false)

  // Add a state to track collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  // Filter states
  const [filters, setFilters] = useState<Filters>({
    country: "",
    city: "",
    district: "",
    category: "",
  })

  // Available filter options
  const [filterOptions, setFilterOptions] = useState<{
    countries: string[]
    cities: string[]
    districts: string[]
    categories: string[]
  }>({
    countries: [],
    cities: [],
    districts: [],
    categories: [],
  })

  // Add a search state for devices
  const [deviceSearch, setDeviceSearch] = useState<string>("")
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])

  // Add a visual indicator for the report generation process
  const [reportGenerating, setReportGenerating] = useState(false)

  // Add a new state for tracking selection animation:
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

  // Helper functions for calculations and recommendations
  const calculateAveragePM25 = (sites: SiteData[]): number => {
    if (sites.length === 0) return 0
    const sum = sites.reduce((acc, site) => acc + (site.pm2_5?.value || 0), 0)
    return sum / sites.length
  }

  const getAverageAQICategory = (sites: SiteData[]): string => {
    if (sites.length === 0) return "Good" // Default value
    const aqiCategories = sites.map((site) => site.aqi_category || "Unknown")
    const categoryCounts: { [key: string]: number } = {}
    aqiCategories.forEach((category) => {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })

    let mostFrequentCategory = "Good"
    let maxCount = 0
    for (const category in categoryCounts) {
      if (categoryCounts[category] > maxCount) {
        mostFrequentCategory = category
        maxCount = categoryCounts[category]
      }
    }
    return mostFrequentCategory
  }

  const calculateAveragePercentageChange = (sites: SiteData[]): number => {
    if (sites.length === 0) return 0
    const sum = sites.reduce((acc, site) => acc + (site.averages?.percentageDifference || 0), 0)
    return sum / sites.length
  }

  const calculateAQICategoryCounts = (sites: SiteData[]): { [key: string]: number } => {
    const categoryCounts: { [key: string]: number } = {}
    sites.forEach((site) => {
      const category = site.aqi_category || "Unknown"
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })
    return categoryCounts
  }

  const calculateMostCommonCategory = (sites: SiteData[]): string => {
    const categoryCounts = calculateAQICategoryCounts(sites)
    let mostCommon = ""
    let maxCount = 0
    for (const category in categoryCounts) {
      if (categoryCounts[category] > maxCount) {
        mostCommon = category
        maxCount = categoryCounts[category]
      }
    }
    return mostCommon
  }

  const compareToAverage = (value: number, average: number): string => {
    if (value > average) {
      return "higher than"
    } else if (value < average) {
      return "lower than"
    } else {
      return "equal to"
    }
  }

  const getConclusion = (selectedSite: SiteData | null, filters: Filters, filteredData: SiteData[]): string => {
    if (selectedSite) {
      return `In conclusion, the air quality at ${selectedSite.siteDetails.name} requires attention. Further investigation and mitigation strategies are recommended.`
    }

    if (filters.country || filters.city || filters.category) {
      return `In conclusion, the air quality in the selected region requires attention. Further investigation and mitigation strategies are recommended.`
    }

    if (filteredData.length === 0) {
      return "In conclusion, no data is available for the selected criteria."
    }

    return "In conclusion, this report provides an overview of the air quality across the AirQo network. Continued monitoring and proactive measures are essential to ensure public health."
  }

  const getRegionalInsights = (filters: Filters, filteredData: SiteData[]): string => {
    if (filters.country) {
      return `The air quality in ${filters.country} shows varying levels of pollution, with some areas exceeding recommended limits. Targeted interventions are needed to address specific pollution sources.`
    }

    if (filters.city) {
      return `The air quality in ${filters.city} is a concern, with PM2.5 levels frequently exceeding WHO guidelines. Local authorities should implement measures to reduce emissions from traffic and industry.`
    }

    if (filters.category) {
      return `The air quality at ${filters.category} sites is generally poorer than at other locations. Specific measures should be taken to protect vulnerable populations in these areas.`
    }

    if (filteredData.length === 0) {
      return "No regional insights are available due to lack of data."
    }

    return "Regional insights indicate that air pollution is a widespread problem, with significant variations across different areas. A coordinated approach is needed to tackle this issue effectively."
  }

  const getHealthRecommendations = (aqiCategory: string): string[] => {
    switch (aqiCategory.toLowerCase()) {
      case "good":
        return ["Enjoy your usual outdoor activities."]
      case "moderate":
        return ["Sensitive groups should reduce prolonged or heavy outdoor exertion."]
      case "unhealthy for sensitive groups":
        return [
          "Sensitive groups should avoid prolonged outdoor exertion.",
          "Everyone else should reduce prolonged or heavy outdoor exertion.",
        ]
      case "unhealthy":
        return ["Sensitive groups should avoid all outdoor exertion.", "Everyone else should reduce outdoor exertion."]
      case "very unhealthy":
        return ["Everyone should avoid all outdoor exertion.", "Sensitive groups should remain indoors."]
      case "hazardous":
        return ["Everyone should remain indoors.", "Keep windows and doors closed.", "Use air purifiers if available."]
      default:
        return ["Air quality data is unavailable. Please check later."]
    }
  }

  const getPolicyRecommendations = (aqiCategory: string, filters: Filters): string[] => {
    const recommendations: string[] = []

    if (filters.country) {
      recommendations.push(`Implement stricter emission standards for vehicles and industries in ${filters.country}.`)
    }

    if (filters.city) {
      recommendations.push(`Invest in public transportation and promote cycling and walking in ${filters.city}.`)
    }

    if (filters.category) {
      recommendations.push(`Implement targeted measures to reduce pollution at ${filters.category} sites.`)
    }

    switch (aqiCategory.toLowerCase()) {
      case "good":
        recommendations.push("Maintain current air quality standards.")
        break
      case "moderate":
        recommendations.push("Monitor air quality closely and take action if pollution levels rise.")
        break
      case "unhealthy for sensitive groups":
        recommendations.push("Issue health advisories and take steps to reduce pollution levels.")
        break
      case "unhealthy":
        recommendations.push("Implement emergency measures to reduce pollution levels and protect public health.")
        break
      case "very unhealthy":
        recommendations.push("Declare a public health emergency and take immediate action to reduce pollution levels.")
        break
      case "hazardous":
        recommendations.push(
          "Evacuate vulnerable populations and take all possible measures to reduce pollution levels.",
        )
        break
      default:
        recommendations.push("Air quality data is unavailable. Please check later.")
    }

    return recommendations
  }

  const getChangeIcon = (trend: number): ReactNode => {
    if (trend < 0) {
      return <ArrowDown className="text-green-500 w-8 h-8" />
    } else if (trend > 0) {
      return <ArrowUp className="text-red-500 w-8 h-8" />
    } else {
      return <Minus className="text-gray-500 w-8 h-8" />
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await getReportData()
        if (data) {
          const typedData = data as SiteData[]
          setSiteData(typedData)
          setFilteredData(typedData)

          // Extract filter options
          const countries = Array.from(new Set(typedData.map((site) => site.siteDetails?.country || "Unknown")))
          const categories = Array.from(
            new Set(
              typedData.map((site) => {
                const category = site.siteDetails?.site_category?.category || "Uncategorized"
                // Replace "Water Body Sites" with "Urban Background Sites"
                return category === "Water Body" ? "Urban Background" : category
              }),
            ),
          )

          setFilterOptions({
            countries,
            cities: [],
            districts: [],
            categories,
          })
        } else {
          setError("No data available")
        }
      } catch (err) {
        setError("Failed to load report data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update cities and districts when country changes
  useEffect(() => {
    if (filters.country) {
      const countrySites = siteData.filter((site) => site.siteDetails?.country === filters.country)
      const cities = Array.from(new Set(countrySites.map((site) => site.siteDetails?.city || "Unknown")))
      const districts = Array.from(new Set(countrySites.map((site) => site.siteDetails?.district || "Unknown")))

      setFilterOptions((prev) => ({
        ...prev,
        cities,
        districts,
      }))

      // Reset city and district when country changes
      setFilters((prev) => ({
        ...prev,
        city: "",
        district: "",
      }))
    }
  }, [filters.country, siteData])

  // Apply filters
  useEffect(() => {
    let result = [...siteData]

    // Apply country filter
    if (filters.country) {
      result = result.filter((site) => site.siteDetails?.country === filters.country)
    }

    // Apply city filter
    if (filters.city) {
      result = result.filter((site) => site.siteDetails?.city === filters.city)
    }

    // Apply district filter
    if (filters.district) {
      result = result.filter((site) => site.siteDetails?.district === filters.district)
    }

    // Apply category filter
    if (filters.category) {
      result = result.filter((site) => {
        const category = site.siteDetails?.site_category?.category || "Uncategorized"
        // Handle the special case for Water Body -> Urban Background
        if (filters.category === "Urban Background") {
          return category === "Urban Background" || category === "Water Body"
        }
        return category === filters.category
      })
    }

    setFilteredData(result)
    // Reset selected site if it's no longer in filtered data
    if (selectedSite && !result.some((site) => site._id === selectedSite._id)) {
      setSelectedSite(null)
    }
  }, [filters, siteData, selectedSite])

  // Handle filter changes
  const handleFilterChange = (filterType: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
  }

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      country: "",
      city: "",
      district: "",
      category: "",
    })
    setSelectedSite(null)
  }

  // Add this function after the resetFilters function
  const handleDeviceSearch = (searchTerm: string) => {
    setDeviceSearch(searchTerm)
  }

  const toggleDeviceSelection = (deviceId: string) => {
    setLastSelectedId(deviceId)
    setTimeout(() => setLastSelectedId(null), 1000)

    setSelectedDevices((prev) => (prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]))
  }

  const selectAllDevices = () => {
    const allDeviceIds = filteredData.map((site) => site._id)
    setSelectedDevices(allDeviceIds)
  }

  const clearDeviceSelection = () => {
    setSelectedDevices([])
  }

  // Add this function to get filtered devices based on search
  const getFilteredDevices = () => {
    if (!deviceSearch.trim()) return filteredData

    return filteredData.filter((site) => {
      const siteName = site.siteDetails?.name || site.siteDetails?.formatted_name || ""
      const city = site.siteDetails?.city || ""
      const country = site.siteDetails?.country || ""
      const searchTerm = deviceSearch.toLowerCase()

      return (
        siteName.toLowerCase().includes(searchTerm) ||
        city.toLowerCase().includes(searchTerm) ||
        country.toLowerCase().includes(searchTerm)
      )
    })
  }

  // Generate PDF report
  const generatePDF = async () => {
    if (!reportRef.current) return

    setIsGeneratingPDF(true)

    try {
      // If advanced analysis is enabled but only one tab is visible,
      // temporarily show both tabs for the PDF
      const originalTab = activeTab
      let tempShowBothTabs = false

      if (showAdvancedAnalysis) {
        tempShowBothTabs = true
        // Force render both tabs for PDF
        setActiveTab("both")
      }

      // Wait a moment for the UI to update with both tabs if needed
      await new Promise((resolve) => setTimeout(resolve, 500))

      const reportElement = reportRef.current

      // Reduce scale to decrease file size (from 2 to 1.5)
      const canvas = await html2canvas(reportElement, {
        scale: 1.5, // Reduced from 2 to 1.5 to decrease file size
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      const imgData = canvas.toDataURL("image/png", 0.7) // Added compression quality parameter (0.7)

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true, // Enable compression
      })

      // Define margins
      const pageWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const marginLeft = 15 // Left margin in mm
      const marginRight = 15 // Right margin in mm
      const marginTop = 20 // Top margin in mm
      const marginBottom = 25 // Bottom margin in mm (extra space for footer)

      const contentWidth = pageWidth - marginLeft - marginRight
      const contentHeight = pageHeight - marginTop - marginBottom

      const imgWidth = contentWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Find sections in the report to create page breaks
      const sections = []
      const footerSection = reportElement.querySelector(".text-xs.text-gray-500.border-t")
      if (footerSection) {
        const footerRect = footerSection.getBoundingClientRect()
        const reportRect = reportElement.getBoundingClientRect()
        const footerPosition = (footerRect.top - reportRect.top) / reportRect.height
        sections.push(footerPosition)
      }

      // Add advanced analysis section break if it exists
      if (showAdvancedAnalysis) {
        const advancedSection = reportElement.querySelector(".pt-8.border-t.border-gray-200")
        if (advancedSection) {
          const advancedRect = advancedSection.getBoundingClientRect()
          const reportRect = reportElement.getBoundingClientRect()
          const advancedPosition = (advancedRect.top - reportRect.top) / reportRect.height
          sections.push(advancedPosition)
        }
      }

      // Sort sections by position
      sections.sort((a, b) => a - b)

      // If the report is longer than a page, create multiple pages
      let heightLeft = imgHeight
      let position = marginTop // Start with top margin
      let pageCount = 1
      let currentPage = 0
      let lastSection = 0

      // Calculate how many pages we'll need
      const totalPages = Math.ceil(imgHeight / contentHeight)

      // Function to add page number
      const addPageNumber = (pageNum: number) => {
        pdf.setFontSize(9) // Smaller font size
        pdf.setTextColor(100, 100, 100)
        pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" })
      }

      // Add first page with margins
      pdf.addImage(imgData, "PNG", marginLeft, position, imgWidth, imgHeight)
      addPageNumber(pageCount)

      heightLeft -= contentHeight
      currentPage += contentHeight / imgHeight

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        // Check if we need to force a page break at a section
        let forceSectionBreak = false
        for (const section of sections) {
          if (section > lastSection && section <= currentPage) {
            // This section falls on the current page, force a break
            forceSectionBreak = true
            lastSection = section
            break
          }
        }

        // Add a new page
        pdf.addPage()
        pageCount++

        // Calculate position for next page
        // If we're forcing a section break, align to the section
        if (forceSectionBreak) {
          position = marginTop - lastSection * canvas.height * (imgWidth / canvas.width)
        } else {
          position = marginTop - pageHeight * (pageCount - 1)
        }

        pdf.addImage(imgData, "PNG", marginLeft, position, imgWidth, imgHeight)
        addPageNumber(pageCount)

        heightLeft -= contentHeight
        currentPage += contentHeight / imgHeight
      }

      // Generate filename based on filters or selected site
      let filename = "air-quality-report"
      if (selectedSite) {
        filename = `air-quality-report-${selectedSite.siteDetails.name.replace(/\s+/g, "-").toLowerCase()}`
      } else if (filters.country || filters.city || filters.category) {
        const parts = []
        if (filters.country) parts.push(filters.country)
        if (filters.city) parts.push(filters.city)
        if (filters.category) parts.push(filters.category)
        filename = `air-quality-report-${parts.join("-").replace(/\s+/g, "-").toLowerCase()}`
      }

      pdf.save(`${filename}-${format(new Date(), "yyyy-MM-dd")}.pdf`)

      // Restore original tab state if we temporarily changed it
      if (tempShowBothTabs) {
        setActiveTab(originalTab)
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Add hotspots detection function
  const getHotspotSites = (sites: SiteData[], limit = 3): SiteData[] => {
    if (sites.length === 0) return []

    // Sort sites by PM2.5 value in descending order and take the top 'limit' sites
    return [...sites]
      .filter((site) => site.pm2_5?.value !== undefined && site.pm2_5?.value !== null)
      .sort((a, b) => (b.pm2_5?.value || 0) - (a.pm2_5?.value || 0))
      .slice(0, limit)
  }

  // Add this after the getHotspotSites function
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false)

  if (loading) {
    return <LoadingState />
  }

  if (error || siteData.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center px-4 py-12 space-y-10 text-center">
        <div className="text-3xl font-bold text-gray-800">{error || "No report data available"}</div>
        <p className="text-xl text-gray-600 max-w-2xl">
          We couldn&apos;t load the air quality report data. Please try again later.
        </p>
      </div>
    )
  }

  // Group sites by category
  const sitesByCategory: Record<string, SiteData[]> = {}
  filteredData.forEach((site) => {
    let category = site.siteDetails?.site_category?.category || "Uncategorized"

    // Replace "Water Body" with "Urban Background" for display
    if (category === "Water Body") {
      category = "Urban Background"
    }

    if (!sitesByCategory[category]) {
      sitesByCategory[category] = []
    }
    sitesByCategory[category].push(site)
  })

  // Generate report title based on filters or selected site
  const getReportTitle = () => {
    if (selectedSite) {
      return `Air Quality Report for ${selectedSite.siteDetails.name}`
    }

    if (selectedDevices.length > 0 && selectedDevices.length < filteredData.length) {
      return `Air Quality Report for ${selectedDevices.length} Selected Devices`
    }

    const parts = []
    if (filters.country) parts.push(filters.country)
    if (filters.city) parts.push(filters.city)
    if (filters.district) parts.push(filters.district)
    if (filters.category)
      parts.push(filters.category === "Urban Background" ? "Urban Background Sites" : `${filters.category} Sites`)

    return parts.length > 0 ? `Air Quality Report for ${parts.join(", ")}` : "Comprehensive Air Quality Report"
  }

  // Add a function to toggle category collapse state
  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  // Get location information for report
  const getLocationInfo = () => {
    if (selectedSite) {
      return {
        city: selectedSite.siteDetails?.city || "Unknown City",
        country: selectedSite.siteDetails?.country || "Unknown Country",
        name: selectedSite.siteDetails?.name || "Unknown Site",
      }
    }

    return {
      city: filters.city || "All Cities",
      country: filters.country || "All Countries",
      name: filters.category ? `${filters.category} Sites` : "All Sites",
    }
  }

  // Calculate average PM2.5 for AQI index visualization
  const avgPM25 = calculateAveragePM25(filteredData)
  const avgAQICategory = getAverageAQICategory(filteredData)

  const getAQICategoryCounts = (sites: SiteData[]): { [key: string]: number } => {
    const categoryCounts: { [key: string]: number } = {}
    sites.forEach((site) => {
      const category = site.aqi_category || "Unknown"
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })
    return categoryCounts
  }

  const getMostCommonCategory = (sites: SiteData[]): string => {
    const categoryCounts = getAQICategoryCounts(sites)
    let mostCommon = ""
    let maxCount = 0
    for (const category in categoryCounts) {
      if (categoryCounts[category] > maxCount) {
        mostCommon = category
        maxCount = categoryCounts[category]
      }
    }
    return mostCommon
  }

  const mostCommonCategory = getMostCommonCategory(filteredData)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Air Quality Reports</h1>
        <p className="text-gray-600">
          Real-time insights and analytics on air quality across different site categories
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 className="text-lg font-semibold mb-2 md:mb-0">Filter Reports</h2>
          <Button variant="outline" onClick={resetFilters} className="w-full md:w-auto">
            Reset Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Country</label>
            <Select value={filters.country} onValueChange={(value) => handleFilterChange("country", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {filterOptions.countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">City</label>
            <Select
              value={filters.city}
              onValueChange={(value) => handleFilterChange("city", value)}
              disabled={!filters.country}
            >
              <SelectTrigger>
                <SelectValue placeholder={filters.country ? "Select city" : "Select country first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {filterOptions.cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">District</label>
            <Select
              value={filters.district}
              onValueChange={(value) => handleFilterChange("district", value)}
              disabled={!filters.country}
            >
              <SelectTrigger>
                <SelectValue placeholder={filters.country ? "Select district" : "Select country first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {filterOptions.districts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Category</label>
            <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filterOptions.categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Filter summary */}
      <div className="bg-blue-50 rounded-lg p-4 mb-8 border border-blue-100">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="font-medium text-blue-800">Active Filters:</span>
          {Object.entries(filters).some(([, value]) => value) ? (
            <>
              {filters.country && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  Country: {filters.country}
                </span>
              )}
              {filters.city && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">City: {filters.city}</span>
              )}
              {filters.district && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  District: {filters.district}
                </span>
              )}
              {filters.category && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  Category: {filters.category}
                </span>
              )}
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                Most Common AQI Category: {mostCommonCategory}
              </span>
            </>
          ) : (
            <span className="text-blue-800 text-sm">None - showing all data</span>
          )}
        </div>
        <div className="mt-2 text-sm text-blue-700">
          Showing {filteredData.length} of {siteData.length} sites
        </div>
      </div>

      {/* Selected Devices Counter */}
      {selectedDevices.length > 0 && (
        <div className="bg-blue-600 text-white rounded-lg p-4 mb-8 shadow-lg transform transition-all duration-300 hover:scale-105">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-white text-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-4">
                {selectedDevices.length}
              </div>
              <div>
                <h3 className="text-xl font-bold">Devices Selected</h3>
                <p className="text-blue-100">
                  {selectedDevices.length === 1
                    ? "1 device selected for reporting"
                    : `${selectedDevices.length} devices selected for reporting`}
                </p>
              </div>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={clearDeviceSelection}
                className="bg-transparent border-white text-white hover:bg-blue-700"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Category Breakdown */}
          {selectedDevices.length > 1 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(sitesByCategory).map(([category, sites]) => {
                const selectedCount = sites.filter((site) => selectedDevices.includes(site._id)).length
                if (selectedCount === 0) return null

                return (
                  <div key={`selected-${category}`} className="bg-blue-700 rounded-lg p-2 text-center">
                    <div className="text-sm text-blue-200">{category}</div>
                    <div className="text-lg font-bold">{selectedCount} selected</div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-blue-500">
            <div className="flex justify-between items-center">
              <p className="text-blue-100">Generate a report with your selected devices</p>
              <Button
                onClick={() => {
                  setReportGenerating(true)

                  // Filter data to only include selected devices
                  const selectedSitesData = filteredData.filter((site) => selectedDevices.includes(site._id))

                  // Update filtered data to only show selected devices in the report
                  setFilteredData(selectedSitesData)

                  // If only one device is selected, set it as the selected site
                  if (selectedDevices.length === 1) {
                    const site = selectedSitesData[0]
                    if (site) setSelectedSite(site)
                  }

                  // Show the report on page with a slight delay for visual effect
                  setTimeout(() => {
                    setShowReportOnPage(true)
                    setReportGenerating(false)

                    // Scroll to the report
                    const reportElement = document.getElementById("report-section")
                    if (reportElement) {
                      reportElement.scrollIntoView({ behavior: "smooth" })
                    }
                  }, 800)
                }}
                disabled={reportGenerating}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                {reportGenerating ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    Generating...
                  </>
                ) : (
                  <>Generate Report</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Device Search and Selection */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 className="text-lg font-semibold mb-2 md:mb-0">Device Selection</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={selectAllDevices} size="sm">
              Select All
            </Button>
            <Button variant="outline" onClick={clearDeviceSelection} size="sm">
              Clear All
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search devices by name, city, or country"
              value={deviceSearch}
              onChange={(e) => handleDeviceSearch(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => {
                if (selectedDevices.length > 0) {
                  setReportGenerating(true)

                  // Filter data to only include selected devices
                  const selectedSitesData = filteredData.filter((site) => selectedDevices.includes(site._id))

                  // Update filtered data to only show selected devices in the report
                  setFilteredData(selectedSitesData)

                  // If only one device is selected, set it as the selected site
                  if (selectedDevices.length === 1) {
                    const site = selectedSitesData[0]
                    if (site) setSelectedSite(site)
                  }

                  // Show the report on page with a slight delay for visual effect
                  setTimeout(() => {
                    setShowReportOnPage(true)
                    setReportGenerating(false)
                  }, 800)
                }
              }}
              disabled={selectedDevices.length === 0 || reportGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
            >
              {reportGenerating ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Generating...
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {getFilteredDevices()
              .slice(0, 9)
              .map((site) => (
                <div key={site._id} className="flex items-center space-x-2 p-2 border rounded-md">
                  <Checkbox
                    id={`main-device-${site._id}`}
                    checked={selectedDevices.includes(site._id)}
                    onCheckedChange={() => toggleDeviceSelection(site._id)}
                  />
                  <label htmlFor={`main-device-${site._id}`} className="text-sm flex-1 cursor-pointer truncate">
                    {site.siteDetails.name || site.siteDetails.formatted_name || "Unknown Site"}
                    <span className="text-xs text-gray-500 ml-1">({site.siteDetails.city || "Unknown"})</span>
                  </label>
                </div>
              ))}
          </div>

          {getFilteredDevices().length > 9 && (
            <div className="text-center text-sm text-blue-600">
              {getFilteredDevices().length - 9} more devices available. Refine your search to see more.
            </div>
          )}

          <div className="text-sm text-gray-600">
            {selectedDevices.length} of {filteredData.length} devices selected
          </div>
        </div>
      </div>

      {/* Report Action Buttons */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={() => setShowReportOnPage(!showReportOnPage)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {showReportOnPage ? "Hide Report" : "View Report"}
        </Button>
        {showReportOnPage && selectedDevices.length > 0 && selectedDevices.length < siteData.length && (
          <Button
            onClick={() => {
              // Reset to show all filtered data based on current filters
              let result = [...siteData]

              // Apply country filter
              if (filters.country) {
                result = result.filter((site) => site.siteDetails?.country === filters.country)
              }

              // Apply city filter
              if (filters.city) {
                result = result.filter((site) => site.siteDetails?.city === filters.city)
              }

              // Apply district filter
              if (filters.district) {
                result = result.filter((site) => site.siteDetails?.district === filters.district)
              }

              // Apply category filter
              if (filters.category) {
                result = result.filter((site) => {
                  const category = site.siteDetails?.site_category?.category || "Uncategorized"
                  if (filters.category === "Urban Background") {
                    return category === "Urban Background" || category === "Water Body"
                  }
                  return category === filters.category
                })
              }

              setFilteredData(result)
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white ml-2"
          >
            Back to All Data
          </Button>
        )}
      </div>

      {showReportOnPage && (
        <div id="report-section" className="mb-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{getReportTitle()}</h2>
            <div className="flex space-x-2">
              <Button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button
                onClick={() => window.print()}
                className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={() => setShowAdvancedAnalysis(!showAdvancedAnalysis)}
                className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white"
              >
                <BrainCircuit className="mr-2 h-4 w-4" />
                {showAdvancedAnalysis ? "Hide Advanced Analysis" : "Show Advanced Analysis"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 mb-4">
            <Label htmlFor="advanced-mode" className="text-sm font-medium cursor-pointer">
              Advanced Spatial Analysis
            </Label>
            <Switch id="advanced-mode" checked={showAdvancedAnalysis} onCheckedChange={setShowAdvancedAnalysis} />
          </div>

          <div ref={reportRef} className="space-y-6">
            {/* Report Header */}
            <div className="text-center mb-6 border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800">{getReportTitle()}</h2>
              <p className="text-gray-600 mt-2">
                {getLocationInfo().city}, {getLocationInfo().country}
              </p>
              <p className="text-gray-500 mt-1">Report Date: {format(new Date(), "MMMM d, yyyy")}</p>
            </div>

            {/* Introduction */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Introduction</h3>
              <p className="text-gray-700">
                This report provides a comprehensive analysis of air quality data for
                {selectedSite
                  ? ` ${selectedSite.siteDetails.name} in ${selectedSite.siteDetails.city || "Unknown City"}, ${selectedSite.siteDetails.country || "Unknown Country"}.`
                  : filters.country || filters.city || filters.category
                    ? ` the selected region (${[filters.country, filters.city, filters.district, filters.category].filter(Boolean).join(", ")}).`
                    : " all monitored sites in the AirQo network."}{" "}
                The data was collected using AirQo&apos;s network of low-cost air quality sensors, which measure
                particulate matter (PM2.5) and other pollutants in real-time. This report analyzes the current air
                quality status, compares it with previous periods, and provides health recommendations based on the
                findings.
              </p>
            </div>

            {/* AQI Index Visualization */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Current Air Quality Status</h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <AQIIndexVisual
                  aqiCategory={selectedSite ? selectedSite.aqi_category || "Unknown" : avgAQICategory}
                  pm25Value={selectedSite ? selectedSite.pm2_5?.value || 0 : avgPM25}
                />
              </div>
            </div>

            {/* Results Section with Charts */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Results</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-1">Sites Analyzed</h4>
                  <p className="text-2xl font-bold">{filteredData.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-1">Average PM2.5</h4>
                  <p className="text-2xl font-bold">{calculateAveragePM25(filteredData).toFixed(1)} µg/m³</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-1">Weekly Change</h4>
                  <p className="text-2xl font-bold flex items-center">
                    {calculateAveragePercentageChange(filteredData).toFixed(1)}%
                    {calculateAveragePercentageChange(filteredData) < 0 ? (
                      <ArrowDown className="ml-1 w-5 h-5 text-green-500" />
                    ) : calculateAveragePercentageChange(filteredData) > 0 ? (
                      <ArrowUp className="ml-1 w-5 h-5 text-red-500" />
                    ) : (
                      <Minus className="ml-1 w-5 h-5 text-gray-500" />
                    )}
                  </p>
                </div>
              </div>

              {/* Charts */}
              <div className="space-y-6">
                <PM25BarChart sites={filteredData} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AQICategoryChart sites={filteredData} />
                  <WeeklyComparisonChart sites={filteredData} />
                </div>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2">Key Findings</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>
                    The average PM2.5 concentration is{" "}
                    <strong>{calculateAveragePM25(filteredData).toFixed(1)} µg/m³</strong>, which is classified as{" "}
                    <strong>{avgAQICategory}</strong>.
                  </li>
                  <li>
                    There has been a{" "}
                    <strong>
                      {Math.abs(calculateAveragePercentageChange(filteredData)).toFixed(1)}%{" "}
                      {calculateAveragePercentageChange(filteredData) < 0 ? "decrease" : "increase"}
                    </strong>{" "}
                    in PM2.5 levels compared to the previous week.
                  </li>
                  {Object.entries(calculateAQICategoryCounts(filteredData)).length > 1 && (
                    <li>
                      The most common air quality category is{" "}
                      <strong>{calculateMostCommonCategory(filteredData)}</strong>, representing{" "}
                      {(
                        (calculateAQICategoryCounts(filteredData)[calculateMostCommonCategory(filteredData)] /
                          filteredData.length) *
                        100
                      ).toFixed(0)}
                      % of all sites.
                    </li>
                  )}
                  {selectedSite && (
                    <li>
                      {selectedSite.siteDetails.name} has a PM2.5 reading of{" "}
                      <strong>{(selectedSite.pm2_5?.value || 0).toFixed(1)} µg/m³</strong>, which is{" "}
                      {compareToAverage(selectedSite.pm2_5?.value || 0, calculateAveragePM25(filteredData))} the
                      regional average.
                    </li>
                  )}
                  {filteredData.length > 1 && getHotspotSites(filteredData).length > 0 && (
                    <li>
                      <strong>Pollution Hotspots:</strong>{" "}
                      {getHotspotSites(filteredData).map((site, index, arr) => (
                        <span key={site._id}>
                          {site.siteDetails?.name || "Unknown Site"} ({(site.pm2_5?.value || 0).toFixed(1)} µg/m³)
                          {index < arr.length - 1 ? ", " : ""}
                        </span>
                      ))}
                      {" are the areas with the highest pollution levels."}
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {showAdvancedAnalysis && (
              <div className="mb-8">
                <AdvancedAnalysisSection sites={filteredData} activeTab={activeTab} />
              </div>
            )}

            {/* Conclusion */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Conclusion</h3>
              <p className="text-gray-700 mb-4">{getConclusion(selectedSite, filters, filteredData)}</p>

              <p className="text-gray-700">{getRegionalInsights(filters, filteredData)}</p>
            </div>

            {/* Recommendations */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Recommendations</h3>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">Health Recommendations</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-2">
                  {getHealthRecommendations(
                    selectedSite ? selectedSite.aqi_category : getAverageAQICategory(filteredData),
                  ).map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Policy Recommendations</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-2">
                  {getPolicyRecommendations(
                    selectedSite ? selectedSite.aqi_category : getAverageAQICategory(filteredData),
                    filters,
                  ).map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-gray-500 border-t pt-4 mt-6">
              <p>
                Report generated by AirQo AI Platform on {format(new Date(), "MMMM d, yyyy")} at{" "}
                {format(new Date(), "h:mm a")}.
              </p>
              <p>Data is based on readings from the AirQo monitoring network. For more information, visit airqo.net.</p>
            </div>

            {/* Jump to Categories Button */}
            <div className="mt-8 text-center">
              <Button
                onClick={() => {
                  const categoriesElement = document.getElementById("categories-section")
                  if (categoriesElement) {
                    categoriesElement.scrollIntoView({ behavior: "smooth" })
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Jump to Device Categories
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Total Monitoring Sites"
          value={filteredData.length.toString()}
          icon={<Globe className="text-blue-500 w-8 h-8" />}
        />
        <SummaryCard
          title="Average PM2.5"
          value={`${calculateAveragePM25(filteredData).toFixed(1)} µg/m³`}
          icon={<BarChart3 className="text-green-500 w-8 h-8" />}
        />
        <SummaryCard
          title="Weekly Change"
          value={`${calculateAveragePercentageChange(filteredData).toFixed(1)}%`}
          icon={getChangeIcon(calculateAveragePercentageChange(filteredData))}
          trend={calculateAveragePercentageChange(filteredData)}
        />
      </div>

      {/* No results message */}
      {filteredData.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 text-center mb-8">
          <h3 className="text-xl font-semibold text-yellow-800 mb-2">No sites match your filters</h3>
          <p className="text-yellow-700">
            Try adjusting your filter criteria or{" "}
            <button onClick={resetFilters} className="text-blue-600 underline">
              reset all filters
            </button>
            .
          </p>
        </div>
      )}

      {/* Categories Controls */}
      <div id="categories-section" className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Device Categories</h2>
        <Button
          variant="outline"
          onClick={() => {
            const allCollapsed = Object.keys(sitesByCategory).every((category) => collapsedCategories[category])

            if (allCollapsed) {
              // Expand all
              const expanded: Record<string, boolean> = {}
              Object.keys(sitesByCategory).forEach((category) => {
                expanded[category] = false
              })
              setCollapsedCategories(expanded)
            } else {
              // Collapse all
              const collapsed: Record<string, boolean> = {}
              Object.keys(sitesByCategory).forEach((category) => {
                collapsed[category] = true
              })
              setCollapsedCategories(collapsed)
            }
          }}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          {Object.keys(sitesByCategory).every((category) => collapsedCategories[category])
            ? "Expand All Categories"
            : "Collapse All Categories"}
        </Button>
      </div>

      {/* Site Categories */}
      {Object.entries(sitesByCategory).map(([category, sites]) => (
        <div
          key={category}
          className="mb-6 bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out"
        >
          <div className="p-4 flex justify-between items-center cursor-pointer bg-gradient-to-r from-blue-50 to-white hover:from-blue-100">
            <div className="flex items-center">
              <div onClick={() => toggleCategoryCollapse(category)} className="flex items-center cursor-pointer">
                <h2 className="text-2xl font-bold text-gray-800">{category} Sites</h2>
                <div className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {sites.length} {sites.length === 1 ? "device" : "devices"}
                </div>
                <div className="ml-3 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {sites.filter((site) => selectedDevices.includes(site._id)).length} selected
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  // Get all site IDs in this category
                  const categoryDeviceIds = sites.map((site) => site._id)

                  // Check if all devices in this category are already selected
                  const allSelected = categoryDeviceIds.every((id) => selectedDevices.includes(id))

                  if (allSelected) {
                    // If all are selected, deselect all in this category
                    setSelectedDevices((prev) => prev.filter((id) => !categoryDeviceIds.includes(id)))
                  } else {
                    // Otherwise, select all in this category
                    const newSelectedDevices = [...selectedDevices]
                    categoryDeviceIds.forEach((id) => {
                      if (!newSelectedDevices.includes(id)) {
                        newSelectedDevices.push(id)
                      }
                    })
                    setSelectedDevices(newSelectedDevices)
                  }
                }}
                className="mr-2 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                {sites.every((site) => selectedDevices.includes(site._id)) ? "Deselect All" : "Select All"}
              </Button>
              <div
                onClick={() => toggleCategoryCollapse(category)}
                className={`transform transition-transform duration-300 ${collapsedCategories[category] ? "rotate-180" : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-500"
                >
                  <path d="m18 15-6-6-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              collapsedCategories[category] ? "max-h-0 opacity-0" : "max-h-[5000px] opacity-100"
            }`}
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sites.map((site) => {
                const isSiteSelected = selectedDevices.includes(site._id)
                return (
                  <SiteCard
                    key={site._id}
                    site={site}
                    onSelect={() => {
                      setSelectedSite(site)

                      // Generate report for this single device
                      setReportGenerating(true)

                      // Filter data to only include this device
                      const selectedSitesData = [site]

                      // Update filtered data to only show this device in the report
                      setFilteredData(selectedSitesData)

                      // Show the report on page with a slight delay for visual effect
                      setTimeout(() => {
                        setShowReportOnPage(true)
                        setReportGenerating(false)

                        // Scroll to the report
                        const reportElement = document.getElementById("report-section")
                        if (reportElement) {
                          reportElement.scrollIntoView({ behavior: "smooth" })
                        }
                      }, 800)
                    }}
                    isSelected={selectedSite?._id === site._id}
                    isCheckboxSelected={isSiteSelected}
                    onCheckboxChange={() => toggleDeviceSelection(site._id)}
                    lastSelectedId={lastSelectedId}
                  />
                )
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Health Tips Section */}
      <Card className="w-full shadow-lg border border-blue-100 bg-white mt-8">
        <CardHeader className="text-center bg-blue-500 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold flex items-center justify-center space-x-2">
            <HeartPulse className="w-6 h-6" />
            <span>Health Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <HealthTipBox
              title="For Everyone"
              description="Check air quality before outdoor activities. Stay indoors during high pollution events."
            />
            <HealthTipBox
              title="For Sensitive Groups"
              description="Children, elderly, and those with respiratory conditions should limit outdoor exposure when air quality is poor."
            />
            <HealthTipBox
              title="For Active Individuals"
              description="Consider indoor workouts when PM2.5 levels exceed 35.5 µg/m³."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Skeleton className="h-10 w-64 mx-auto mb-2" />
        <Skeleton className="h-6 w-96 mx-auto" />
      </div>

      <Skeleton className="h-24 w-full mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full shadow-md">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-10 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-8 w-48 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="w-full shadow-md">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-20 w-full mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function SiteCard({
  site,
  onSelect,
  isSelected,
  isCheckboxSelected,
  onCheckboxChange,
  lastSelectedId,
}: {
  site: SiteData
  onSelect?: () => void
  isSelected?: boolean
  isCheckboxSelected?: boolean
  onCheckboxChange?: () => void
  lastSelectedId?: string | null
}) {
  const pm25Value = site.pm2_5?.value ?? 0
  const aqiCategory = site.aqi_category || "Unknown"
  const siteName = site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"
  const areaName = site.siteDetails?.site_category?.area_name || "Unknown Area"
  const percentChange = site.averages?.percentageDifference ?? 0
  const currentWeek = site.averages?.weeklyAverages?.currentWeek ?? 0
  const previousWeek = site.averages?.weeklyAverages?.currentWeek ?? 0
  const country = site.siteDetails?.country || "Unknown"
  const city = site.siteDetails?.city || "Unknown"

  // Get color based on AQI category
  const getColorByCategory = (category: string): string => {
    switch (category.toLowerCase()) {
      case "good":
        return "bg-green-100 border-green-300 text-green-800"
      case "moderate":
        return "bg-yellow-100 border-yellow-300 text-yellow-800"
      case "unhealthy for sensitive groups":
        return "bg-orange-100 border-orange-300 text-orange-800"
      case "unhealthy":
        return "bg-red-100 border-red-300 text-red-800"
      case "very unhealthy":
        return "bg-purple-100 border-purple-300 text-purple-800"
      case "hazardous":
        return "bg-red-200 border-red-400 text-red-900"
      default:
        return "bg-gray-100 border-gray-300 text-gray-800"
    }
  }

  return (
    <Card
      className={`w-full shadow-md hover:shadow-lg transition-all duration-300 ${getColorByCategory(aqiCategory)} ${
        isSelected ? "ring-2 ring-blue-500" : ""
      } ${isCheckboxSelected ? "relative overflow-hidden" : ""} ${isCheckboxSelected ? "animate-pulse-subtle" : ""} ${
        site._id === lastSelectedId ? "scale-105 shadow-xl z-10" : ""
      }`}
    >
      {isCheckboxSelected && (
        <div className="absolute -top-1 -right-1 transform rotate-45 bg-blue-500 text-white px-8 py-1 shadow-md">
          Selected
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold mb-1">{siteName}</h3>
            <p className="text-sm mb-1">{areaName}</p>
            <p className="text-xs text-gray-600 mb-3">
              {city}, {country}
            </p>
          </div>
          {onCheckboxChange && (
            <Checkbox
              checked={isCheckboxSelected}
              onCheckedChange={() => {
                if (onCheckboxChange) onCheckboxChange()
              }}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-medium">Current PM2.5</span>
            <div className="text-2xl font-bold">{pm25Value.toFixed(1)} µg/m³</div>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium">AQI Category</span>
            <div className="text-lg font-semibold">{aqiCategory}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-inner">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Weekly Comparison</span>
            <div
              className={`flex items-center ${percentChange < 0 ? "text-green-600" : percentChange > 0 ? "text-red-600" : "text-gray-600"}`}
            >
              {percentChange < 0 ? (
                <ArrowDown className="w-4 h-4 mr-1" />
              ) : percentChange > 0 ? (
                <ArrowUp className="w-4 h-4 mr-1" />
              ) : (
                <Minus className="w-4 h-4 mr-1" />
              )}
              <span className="text-sm font-bold">{Math.abs(percentChange).toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <div>
              <div className="text-gray-500">Previous</div>
              <div className="font-medium">{previousWeek.toFixed(1)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Change</div>
              <div
                className={`font-medium ${percentChange < 0 ? "text-green-600" : percentChange > 0 ? "text-red-600" : "text-gray-600"}`}
              >
                {percentChange < 0 ? "↓" : percentChange > 0 ? "↑" : "−"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-500">Current</div>
              <div className="font-medium">{currentWeek.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {onSelect && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              if (onSelect) onSelect()
            }}
            className="w-full mt-4 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            {isSelected ? "Selected for Report" : "Select for Detailed Report"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string
  value: string
  icon: ReactNode
  trend?: number
}) {
  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-600">{title}</h3>
            <div className="text-3xl font-bold mt-1 flex items-center">
              {value}
              {trend !== undefined && (
                <span
                  className={`ml-2 text-sm font-medium ${
                    trend < 0 ? "text-green-600" : trend > 0 ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  {trend < 0 ? "↓" : trend > 0 ? "↑" : "−"}
                </span>
              )}
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-full">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function HealthTipBox({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">{title}</h3>
      <p className="text-blue-700 text-sm">{description}</p>
    </div>
  )
}

// Add this new component after the HealthTipBox component at the end of the file
// Modify the AdvancedAnalysisSection component to accept and use an activeTab prop
// Modify the AdvancedAnalysisSection component to make it more compact for PDF
function AdvancedAnalysisSection({ sites, activeTab = "moran" }: { sites: SiteData[]; activeTab?: string }) {
  const [localActiveTab, setLocalActiveTab] = useState(activeTab)

  // Use the passed activeTab if it's "both", otherwise use local state
  const effectiveTab = activeTab === "both" ? "both" : localActiveTab

  // Colors for the charts
  const moranColors = ["#ff6b6b", "#4ecdc4", "#ffd166", "#6a0572", "#cccccc"]
  const getisOrdColors = ["#d00000", "#e85d04", "#faa307", "#48cae4", "#0077b6", "#023e8a", "#cccccc"]

  // Simulated data for Local Moran's I analysis with device names
  const moranData = [
    {
      type: "HH (High-High)",
      count: Math.floor(sites.length * 0.25),
      description: "Areas with high PM2.5 values surrounded by areas with high values",
      devices: sites
        .slice(0, Math.floor(sites.length * 0.25))
        .map((site) => site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"),
    },
    {
      type: "LL (Low-Low)",
      count: Math.floor(sites.length * 0.3),
      description: "Areas with low PM2.5 values surrounded by areas with low values",
      devices: sites
        .slice(Math.floor(sites.length * 0.25), Math.floor(sites.length * 0.25) + Math.floor(sites.length * 0.3))
        .map((site) => site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"),
    },
    {
      type: "HL (High-Low)",
      count: Math.floor(sites.length * 0.15),
      description: "Areas with high PM2.5 values surrounded by areas with low values (potential outliers)",
      devices: sites
        .slice(
          Math.floor(sites.length * 0.25) + Math.floor(sites.length * 0.3),
          Math.floor(sites.length * 0.25) + Math.floor(sites.length * 0.3) + Math.floor(sites.length * 0.15),
        )
        .map((site) => site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"),
    },
    {
      type: "LH (Low-High)",
      count: Math.floor(sites.length * 0.1),
      description: "Areas with low PM2.5 values surrounded by areas with high values (potential outliers)",
      devices: sites
        .slice(
          Math.floor(sites.length * 0.25) + Math.floor(sites.length * 0.3) + Math.floor(sites.length * 0.15),
          Math.floor(sites.length * 0.25) +
            Math.floor(sites.length * 0.3) +
            Math.floor(sites.length * 0.15) +
            Math.floor(sites.length * 0.1),
        )
        .map((site) => site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"),
    },
    {
      type: "Not Significant",
      count:
        sites.length -
        (Math.floor(sites.length * 0.25) +
          Math.floor(sites.length * 0.3) +
          Math.floor(sites.length * 0.15) +
          Math.floor(sites.length * 0.1)),
      description: "Areas with no statistically significant spatial autocorrelation",
      devices: sites
        .slice(
          Math.floor(sites.length * 0.25) +
            Math.floor(sites.length * 0.3) +
            Math.floor(sites.length * 0.15) +
            Math.floor(sites.length * 0.1),
        )
        .map((site) => site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"),
    },
  ]

  // Simulated data for Getis-Ord Gi* analysis with device names
  const getisOrdData = [
    {
      type: "Hot Spot (99% Confidence)",
      count: Math.floor(sites.length * 0.1),
      description: "Statistically significant hot spots with 99% confidence",
      devices: sites
        .slice(0, Math.floor(sites.length * 0.1))
        .map((site) => site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"),
    },
    {
      type: "Hot Spot (95% Confidence)",
      count: Math.floor(sites.length * 0.15),
      description: "Statistically significant hot spots with 95% confidence",
      devices: sites
        .slice(Math.floor(sites.length * 0.1), Math.floor(sites.length * 0.1) + Math.floor(sites.length * 0.15))
        .map((site) => site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"),
    },
    {
      type: "Hot Spot (90% Confidence)",
      count: Math.floor(sites.length * 0.1),
      description: "Statistically significant hot spots with 90% confidence",
      devices: sites
        .slice(
          Math.floor(sites.length * 0.1) + Math.floor(sites.length * 0.15),
          Math.floor(sites.length * 0.1) + Math.floor(sites.length * 0.15) + Math.floor(sites.length * 0.1),
        )
        .map((site) => site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"),
    },
    {
      type: "Cold Spot (90% Confidence)",
      count: Math.floor(sites.length * 0.1),
      description: "Statistically significant cold spots with 90% confidence",
      devices: sites
        .slice(
          Math.floor(sites.length * 0.1) + Math.floor(sites.length * 0.15) + Math.floor(sites.length * 0.1),
          Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.15) +
            Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.1),
        )
        .map((site) => site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"),
    },
    {
      type: "Cold Spot (95% Confidence)",
      count: Math.floor(sites.length * 0.15),
      description: "Statistically significant cold spots with 95% confidence",
      devices: sites
        .slice(
          Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.15) +
            Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.1),
          Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.15) +
            Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.15),
        )
        .map((site) => site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"),
    },
    {
      type: "Cold Spot (99% Confidence)",
      count: Math.floor(sites.length * 0.1),
      description: "Statistically significant cold spots with 99% confidence",
      devices: sites
        .slice(
          Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.15) +
            Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.15),
          Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.15) +
            Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.15) +
            Math.floor(sites.length * 0.1),
        )
        .map((site) => site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"),
    },
    {
      type: "Not Significant",
      count:
        sites.length -
        (Math.floor(sites.length * 0.1) +
          Math.floor(sites.length * 0.15) +
          Math.floor(sites.length * 0.1) +
          Math.floor(sites.length * 0.1) +
          Math.floor(sites.length * 0.15) +
          Math.floor(sites.length * 0.1)),
      description: "Areas with no statistically significant hot or cold spots",
      devices: sites
        .slice(
          Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.15) +
            Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.1) +
            Math.floor(sites.length * 0.15) +
            Math.floor(sites.length * 0.1),
        )
        .map((site) => site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"),
    },
  ]

  // Render the Moran's I analysis section
  const renderMoranAnalysis = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">About Local Moran&apos;s I</h4>
        <p className="text-blue-700 text-sm">
          Local Moran&apos;s I is a spatial autocorrelation statistic that identifies clusters and spatial outliers. It
          helps identify areas with similar values clustered together (HH, LL) and areas that are different from their
          neighbors (HL, LH).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Cluster and Outlier Analysis</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moranData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip formatter={(value, name, props) => [`${value} sites`, props.payload.type]} />
                <Legend />
                <Bar dataKey="count" name="Number of Sites" fill="#8884d8">
                  {moranData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={moranColors[index % moranColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Interpretation</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
              {moranData.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: moranColors[index % moranColors.length] }}
                  />
                  <div>
                    <div className="font-medium text-sm">
                      {item.type}: {item.count} sites
                    </div>
                    <div className="text-xs text-gray-600">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-700 mb-2">Key Insights from Local Moran&apos;s I Analysis</h4>
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          <li>
            <strong>High-High Clusters:</strong> {moranData[0].count} sites show high PM2.5 values clustered together,
            indicating potential pollution hotspots that require immediate attention.
          </li>
          <li>
            <strong>Spatial Outliers:</strong> {moranData[2].count + moranData[3].count} sites are spatial outliers (HL
            or LH), suggesting localized emission sources or unique geographical factors affecting air quality.
          </li>
          <li>
            <strong>Low-Low Clusters:</strong> {moranData[1].count} sites show low PM2.5 values clustered together,
            representing areas with consistently better air quality.
          </li>
        </ul>
      </div>

      <Card className="mt-4">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Device Details by Category</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {moranData.map((item, index) => (
              <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: moranColors[index % moranColors.length] }}
                  />
                  <h4 className="font-semibold text-sm">{item.type}</h4>
                </div>
                {item.devices && item.devices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-1">
                    {item.devices.slice(0, 4).map((device, idx) => (
                      <div key={idx} className="text-xs bg-gray-50 p-1 rounded">
                        {device}
                      </div>
                    ))}
                    {item.devices.length > 4 && (
                      <div className="text-xs text-gray-500">+{item.devices.length - 4} more devices</div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No devices in this category</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render the Getis-Ord analysis section
  const renderGetisOrdAnalysis = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">About Getis-Ord Gi* (Hot Spot Analysis)</h4>
        <p className="text-blue-700 text-sm">
          Getis-Ord Gi* is a spatial statistic that identifies statistically significant hot spots (high values) and
          cold spots (low values) in your data. The analysis shows where features with high or low values cluster
          spatially, with different confidence levels (90%, 95%, 99%).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Hot Spot Analysis</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getisOrdData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip formatter={(value, name, props) => [`${value} sites`, props.payload.type]} />
                <Legend />
                <Bar dataKey="count" name="Number of Sites" fill="#8884d8">
                  {getisOrdData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getisOrdColors[index % getisOrdColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Interpretation</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
              {getisOrdData.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: getisOrdColors[index % getisOrdColors.length] }}
                  />
                  <div>
                    <div className="font-medium text-sm">
                      {item.type}: {item.count} sites
                    </div>
                    <div className="text-xs text-gray-600">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-700 mb-2">Key Insights from Getis-Ord Gi* Analysis</h4>
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          <li>
            <strong>Significant Hot Spots:</strong>{" "}
            {getisOrdData[0].count + getisOrdData[1].count + getisOrdData[2].count} sites are identified as
            statistically significant hot spots, with varying confidence levels.
          </li>
          <li>
            <strong>Significant Cold Spots:</strong>{" "}
            {getisOrdData[3].count + getisOrdData[4].count + getisOrdData[5].count} sites are identified as
            statistically significant cold spots, representing areas with consistently lower pollution levels.
          </li>
          <li>
            <strong>Highest Confidence Hot Spots:</strong> {getisOrdData[0].count} sites show hot spots with 99%
            confidence, indicating areas that should be prioritized for intervention.
          </li>
        </ul>
      </div>

      <Card className="mt-4">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Device Details by Category</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {getisOrdData.map((item, index) => (
              <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getisOrdColors[index % getisOrdColors.length] }}
                  />
                  <h4 className="font-semibold text-sm">{item.type}</h4>
                </div>
                {item.devices && item.devices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-1">
                    {item.devices.slice(0, 4).map((device, idx) => (
                      <div key={idx} className="text-xs bg-gray-50 p-1 rounded">
                        {device}
                      </div>
                    ))}
                    {item.devices.length > 4 && (
                      <div className="text-xs text-gray-500">+{item.devices.length - 4} more devices</div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No devices in this category</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Advanced Spatial Analysis</h3>
        {effectiveTab !== "both" && (
          <div className="flex space-x-2">
            <Button
              variant={localActiveTab === "moran" ? "default" : "outline"}
              onClick={() => setLocalActiveTab("moran")}
              className="flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              Local Moran&apos;s I
            </Button>
            <Button
              variant={localActiveTab === "getis" ? "default" : "outline"}
              onClick={() => setLocalActiveTab("getis")}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Getis-Ord Gi*
            </Button>
          </div>
        )}
      </div>

      {/* Render based on the active tab */}
      {effectiveTab === "both" ? (
        <>
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-blue-800 mb-4">Local Moran&apos;s I Analysis</h3>
            {renderMoranAnalysis()}
          </div>
          <div className="pt-8 border-t border-gray-200">
            <h3 className="text-2xl font-semibold text-blue-800 mb-4">Getis-Ord Gi* Analysis</h3>
            {renderGetisOrdAnalysis()}
          </div>
        </>
      ) : localActiveTab === "moran" ? (
        renderMoranAnalysis()
      ) : (
        renderGetisOrdAnalysis()
      )}
    </div>
  )
}
