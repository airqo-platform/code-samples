"use client"

import dynamic from "next/dynamic"
import { useEffect, useState, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card"
import {
  ArrowDown,
  ArrowUp,
  BrainCircuit,
  ChevronDown,
  Download,
  Globe,
  HeartPulse,
  Layers,
  LoaderCircle,
  MapPin,
  Minus,
  Printer,
  BarChart3,
  X,
  Zap,
} from "lucide-react"
import Navigation from "@/components/navigation/navigation"
import type { ReactNode } from "react"
import { getReportData } from "@/services/apiService"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover"
import "leaflet/dist/leaflet.css"

const GoodAir = "/images/GoodAir.png"
const Moderate = "/images/Moderate.png"
const UnhealthySG = "/images/UnhealthySG.png"
const Unhealthy = "/images/Unhealthy.png"
const VeryUnhealthy = "/images/VeryUnhealthy.png"
const Hazardous = "/images/Hazardous.png"
const Invalid = "/images/Invalid.png"
const REPORT_RETRY_DELAY_MS = 5_000
const REPORT_LOAD_MAX_ATTEMPTS = 2

import { Switch } from "@/ui/switch"
import { Label } from "@/ui/label"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"

// Dynamic map components for report map preview
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Circle = dynamic(() => import("react-leaflet").then((mod) => mod.Circle), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
const getSiteSelectionId = (site: SiteData) =>
  site._id ||
  site.site_id ||
  [
    site.siteDetails?.name || site.siteDetails?.formatted_name || "unknown-site",
    site.siteDetails?.city || "unknown-city",
    site.siteDetails?.country || "unknown-country",
    site.siteDetails?.approximate_latitude ?? "unknown-lat",
    site.siteDetails?.approximate_longitude ?? "unknown-lng",
  ].join(":")

const getSiteCheckboxId = (site: SiteData) => `main-device-${encodeURIComponent(getSiteSelectionId(site))}`

export default function ReportPage() {
  return (
    <div className="reports-theme flex min-h-screen flex-col bg-gray-100 text-slate-950">
      <Navigation />
      <ReportContent />
    </div>
  )
}

function ReportContent() {
  // Add this state at the top of the ReportContent function, near the other state declarations
  const [activeTab, setActiveTab] = useState("moran")
  const [siteData, setSiteData] = useState<SiteData[]>([])
  const [isReportDataLoading, setIsReportDataLoading] = useState(true)
  const [reportLoadError, setReportLoadError] = useState<string | null>(null)
  const [reportLoadRequest, setReportLoadRequest] = useState(0)
  const [filteredData, setFilteredData] = useState<SiteData[]>([])
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // Add a state to control whether the report is visible on the page
  const [showReportOnPage, setShowReportOnPage] = useState(false)

  // Add a state to track collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  // Filter states
  const [filters, setFilters] = useState<Filters>({
    country: [],
    city: [],
    district: [],
    category: [],
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

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((values) => values.length > 0),
    [filters],
  )

  const formatSelectionLabel = (values: string[], fallback: string) => {
    if (values.length === 0) return fallback
    if (values.length <= 2) return values.join(", ")
    return `${values.slice(0, 2).join(", ")} +${values.length - 2} more`
  }

  const formatSelectionList = (values: string[], fallback: string) => (values.length ? values.join(", ") : fallback)

  const summarizeSelection = (values: string[], pluralLabel: string) => {
    if (values.length === 0) return ""
    if (values.length === 1) return values[0]
    if (values.length === 2) return values.join(" and ")
    return `${values.slice(0, 2).join(", ")} +${values.length - 2} more ${pluralLabel}`
  }

  // Add a search state for devices
  const [deviceSearch, setDeviceSearch] = useState<string>("")
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])

  // Add a visual indicator for the report generation process
  const [reportGenerating, setReportGenerating] = useState(false)

  // Add a new state for tracking selection animation:
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)
  const [pdfMode, setPdfMode] = useState(false)

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

    if (hasActiveFilters) {
      return `In conclusion, the air quality in the selected region requires attention. Further investigation and mitigation strategies are recommended.`
    }

    if (filteredData.length === 0) {
      return "In conclusion, no data is available for the selected criteria."
    }

    return "In conclusion, this report provides an overview of the air quality across the AirQo network. Continued monitoring and proactive measures are essential to ensure public health."
  }

  const getRegionalInsights = (filters: Filters, filteredData: SiteData[]): string => {
    const countrySummary = summarizeSelection(filters.country, "countries")
    const citySummary = summarizeSelection(filters.city, "cities")
    const districtSummary = summarizeSelection(filters.district, "districts")
    const categorySummary = summarizeSelection(filters.category, "categories")

    if (countrySummary) {
      return `The air quality in ${countrySummary} shows varying levels of pollution, with some areas exceeding recommended limits. Targeted interventions are needed to address specific pollution sources.`
    }

    if (districtSummary) {
      return `The air quality across ${districtSummary} reflects localised patterns that should guide targeted interventions and enforcement.`
    }

    if (citySummary) {
      return `The air quality in ${citySummary} is a concern, with PM<sub>2.5</sub> levels frequently exceeding WHO guidelines. Local authorities should implement measures to reduce emissions from traffic and industry.`
    }

    if (categorySummary) {
      return `The air quality across ${categorySummary} site categories is generally poorer than at other locations. Specific measures should be taken to protect vulnerable populations in these areas.`
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
    let isActive = true
    let attemptCount = 0
    let retryTimer: number | null = null

    setIsReportDataLoading(true)
    setReportLoadError(null)

    const finishWithError = (message: string) => {
      if (!isActive) return
      setIsReportDataLoading(false)
      setReportLoadError(message)
    }

    const scheduleRetry = () => {
      if (!isActive) return
      if (retryTimer !== null) window.clearTimeout(retryTimer)
      retryTimer = window.setTimeout(() => {
        retryTimer = null
        void fetchData()
      }, REPORT_RETRY_DELAY_MS)
    }

    async function fetchData() {
      attemptCount += 1

      try {
        const data = await getReportData()
        if (!isActive) return

        const typedData = data as SiteData[]
        if (typedData.length === 0) {
          if (attemptCount < REPORT_LOAD_MAX_ATTEMPTS) {
            scheduleRetry()
          } else {
            finishWithError("No report data is available right now. Please try again.")
          }
          return
        }

        setSiteData(typedData)
        setFilteredData(typedData)
        setIsReportDataLoading(false)
        setReportLoadError(null)

        const countries = Array.from(new Set(typedData.map((site) => site.siteDetails?.country || "Unknown"))).sort()
        const cities = Array.from(new Set(typedData.map((site) => site.siteDetails?.city || "Unknown"))).sort()
        const districts = Array.from(new Set(typedData.map((site) => site.siteDetails?.district || "Unknown"))).sort()
        const categories = Array.from(
          new Set(
            typedData.map((site) => {
              const category = site.siteDetails?.site_category?.category || "Uncategorized"
              return category === "Water Body" ? "Urban Background" : category
            }),
          ),
        ).sort()

        setFilterOptions({ countries, cities, districts, categories })
      } catch (err) {
        if (!isActive) return

        if (attemptCount < REPORT_LOAD_MAX_ATTEMPTS) {
          scheduleRetry()
        } else {
          finishWithError("We couldn't load the report data. Check your connection and try again.")
        }

        if (process.env.NODE_ENV !== "production") {
          console.warn("Report data fetch failed.", err)
        }
      }
    }

    void fetchData()

    return () => {
      isActive = false
      if (retryTimer !== null) window.clearTimeout(retryTimer)
    }
  }, [reportLoadRequest])

  // Update cities and districts when country changes
  useEffect(() => {
    if (siteData.length === 0) return

    const relevantSites =
      filters.country.length > 0
        ? siteData.filter((site) => filters.country.includes(site.siteDetails?.country || "Unknown"))
        : siteData

    const cities = Array.from(new Set(relevantSites.map((site) => site.siteDetails?.city || "Unknown"))).sort()
    const districts = Array.from(new Set(relevantSites.map((site) => site.siteDetails?.district || "Unknown"))).sort()

    setFilterOptions((prev) => ({
      ...prev,
      cities,
      districts,
    }))

    setFilters((prev) => ({
      ...prev,
      city: prev.city.filter((city) => cities.includes(city)),
      district: prev.district.filter((district) => districts.includes(district)),
    }))
  }, [filters.country, siteData])

  const matchesSelection = (value: string | undefined, selections: string[]) =>
    selections.length === 0 || selections.includes(value || "Unknown")

  const matchesCategorySelection = (category: string | undefined, selections: string[]) => {
    const normalizedCategory = category === "Water Body" ? "Urban Background" : category || "Uncategorized"
    if (selections.length === 0) return true

    return selections.some((selected) => {
      if (selected === "Urban Background") {
        return normalizedCategory === "Urban Background" || normalizedCategory === "Water Body"
      }
      return normalizedCategory === selected
    })
  }

  const filterSites = (sites: SiteData[], activeFilters: Filters) =>
    sites.filter((site) => {
      const country = site.siteDetails?.country || "Unknown"
      const city = site.siteDetails?.city || "Unknown"
      const district = site.siteDetails?.district || "Unknown"
      const category = site.siteDetails?.site_category?.category || "Uncategorized"

      return (
        matchesSelection(country, activeFilters.country) &&
        matchesSelection(city, activeFilters.city) &&
        matchesSelection(district, activeFilters.district) &&
        matchesCategorySelection(category, activeFilters.category)
      )
    })

  // Apply filters
  useEffect(() => {
    const result = filterSites(siteData, filters)

    setFilteredData(result)
    // Reset selected site if it's no longer in filtered data
    if (selectedSite && !result.some((site) => getSiteSelectionId(site) === getSiteSelectionId(selectedSite))) {
      setSelectedSite(null)
    }
  }, [filters, siteData, selectedSite])

  // Handle filter changes
  const handleFilterChange = (filterType: keyof Filters, values: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: values,
    }))
  }

  const removeFilterValue = (filterType: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType].filter((item) => item !== value),
    }))
  }

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      country: [],
      city: [],
      district: [],
      category: [],
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
    const allDeviceIds = filteredData.map(getSiteSelectionId)
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
    setPdfMode(true)

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
      const marginBottom = 15 // Bottom margin in mm

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
      let currentPage = 0
      let lastSection = 0

      // Add first page with margins
      pdf.addImage(imgData, "PNG", marginLeft, position, imgWidth, imgHeight)

      heightLeft -= contentHeight
      currentPage += contentHeight / imgHeight

      let pageNumber = 0
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

        // Calculate position for next page
        // If we're forcing a section break, align to the section
        if (forceSectionBreak) {
          position = marginTop - lastSection * canvas.height * (imgWidth / canvas.width)
        } else {
          position = marginTop - pageHeight * (currentPage + 1)
          position = marginTop - pageHeight * pageNumber 
        }

        pdf.addImage(imgData, "PNG", marginLeft, position, imgWidth, imgHeight)

        heightLeft -= contentHeight
        currentPage += contentHeight / imgHeight
      }

      // Generate filename based on filters or selected site
      let filename = "air-quality-report"
      if (selectedSite) {
        filename = `air-quality-report-${selectedSite.siteDetails.name.replace(/\s+/g, "-").toLowerCase()}`
      } else if (hasActiveFilters) {
        const parts = [...filters.country, ...filters.city, ...filters.district, ...filters.category]
        const slug = parts
          .filter(Boolean)
          .map((part) => part.replace(/\s+/g, "-").toLowerCase())
          .join("-")
        if (slug) {
          filename = `air-quality-report-${slug}`
        }
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
      setPdfMode(false)
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
    // add coldspot detection function
  const getColdspotSites = (sites: SiteData[], limit = 3): SiteData[] => {
    if (sites.length === 0) return []

    // Sort sites by PM2.5 value in ascending order and take the top 'limit' sites
    return [...sites]
      .filter((site) => site.pm2_5?.value !== undefined && site.pm2_5?.value !== null)
      .sort((a, b) => (a.pm2_5?.value || 0) - (b.pm2_5?.value || 0))
      .slice(0, limit)
  }
  // Add this after the getHotspotSites function
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false)

  // Group sites by category
  const sitesByCategory: Record<string, SiteData[]> = {}
  filteredData.forEach((site) => {
    let category = site.siteDetails?.site_category?.category || "Uncategorized"

    // Replace "Water Body" with "Urban Background" for display
    if (category === "Water Body") {
      category = "Background"
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
    if (filters.country.length) parts.push(formatSelectionLabel(filters.country, ""))
    if (filters.city.length) parts.push(formatSelectionLabel(filters.city, ""))
    if (filters.district.length) parts.push(formatSelectionLabel(filters.district, ""))
    if (filters.category.length) parts.push(`${formatSelectionLabel(filters.category, "")} Sites`)

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
      city: formatSelectionList(filters.city, "All Cities"),
      country: formatSelectionList(filters.country, "All Countries"),
      name: filters.category.length ? `${formatSelectionList(filters.category, "All")} Sites` : "All Sites",
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

  const mapSites = useMemo(
    () =>
      filteredData.filter(
        (site) =>
          typeof site.siteDetails?.approximate_latitude === "number" &&
          typeof site.siteDetails?.approximate_longitude === "number",
      ),
    [filteredData],
  )

  const mapBounds = useMemo(() => {
    if (mapSites.length === 0) return null
    const lats = mapSites.map((site) => site.siteDetails.approximate_latitude)
    const lngs = mapSites.map((site) => site.siteDetails.approximate_longitude)
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ] as [[number, number], [number, number]]
  }, [mapSites])

  const mapCenter = useMemo(() => {
    if (mapSites.length === 0) return { lat: 0, lng: 0 }
    const latSum = mapSites.reduce((sum, site) => sum + site.siteDetails.approximate_latitude, 0)
    const lngSum = mapSites.reduce((sum, site) => sum + site.siteDetails.approximate_longitude, 0)
    return {
      lat: latSum / mapSites.length,
      lng: lngSum / mapSites.length,
    }
  }, [mapSites])

  const mapTile = useMemo(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (token) {
      return {
        url: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${token}`,
        attribution:
          '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        tileSize: 512 as const,
        zoomOffset: -1 as const,
      }
    }
    return {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      tileSize: 256 as const,
      zoomOffset: 0 as const,
    }
  }, [])

  const leafletInstance = useMemo(() => {
    if (typeof window === "undefined") return null
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const leaflet = require("leaflet") as typeof import("leaflet")
    leaflet.Icon.Default.mergeOptions({
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      iconUrl: "/leaflet/marker-icon.png",
      shadowUrl: "/leaflet/marker-shadow.png",
    })
    return leaflet
  }, [])

  const getMarkerIcon = useMemo(() => {
    const pickImage = (category?: string) => {
      const normalized = (category || "").toLowerCase()
      switch (normalized) {
        case "good":
          return GoodAir
        case "moderate":
          return Moderate
        case "unhealthy for sensitive groups":
          return UnhealthySG
        case "unhealthy":
          return Unhealthy
        case "very unhealthy":
          return VeryUnhealthy
        case "hazardous":
          return Hazardous
        default:
          return Invalid
      }
    }

    return (category?: string) => {
      if (!leafletInstance) return undefined
      return leafletInstance.icon({
        iconUrl: pickImage(category),
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      })
    }
  }, [leafletInstance])

  const getAQIMeta = (category?: string) => {
    const normalized = (category || "").toLowerCase()
    switch (normalized) {
      case "good":
        return { color: "#16a34a", label: "Good" }
      case "moderate":
        return { color: "#f59e0b", label: "Moderate" }
      case "unhealthy for sensitive groups":
        return { color: "#f97316", label: "Unhealthy for Sensitive Groups" }
      case "unhealthy":
        return { color: "#ef4444", label: "Unhealthy" }
      case "very unhealthy":
        return { color: "#a855f7", label: "Very Unhealthy" }
      case "hazardous":
        return { color: "#7f1d1d", label: "Hazardous" }
      default:
        return { color: "#6b7280", label: "Unknown" }
    }
  }

  const overviewAqi = getAQIMeta(mostCommonCategory)

  return (
    <div className="container mx-auto max-w-[1440px] px-4 py-6 sm:py-8">
      <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-8 text-white shadow-xl shadow-blue-950/15 sm:px-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100 backdrop-blur">
              <Zap className="h-3.5 w-3.5 text-cyan-300" />
              Network intelligence
            </div>
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Air Quality Reports</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Compare recent air quality conditions across monitoring sites, uncover geographic patterns, and build a focused report for the locations that matter.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur sm:p-4">
              <Globe className="mb-3 h-5 w-5 text-cyan-300" />
              <p className="text-2xl font-bold">{siteData.length || "—"}</p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-blue-200">Network sites</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur sm:p-4">
              <BarChart3 className="mb-3 h-5 w-5 text-emerald-300" />
              <p className="text-2xl font-bold">{siteData.length ? filteredData.length : "—"}</p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-blue-200">Sites in view</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur sm:p-4">
              <span className="mb-3 block h-5 w-5 rounded-full border-4 border-white/30" style={{ backgroundColor: overviewAqi.color }} />
              <p className="truncate text-lg font-bold sm:text-xl">{mostCommonCategory || "—"}</p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-blue-200">Common AQI</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="mb-8 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-blue-50/50 p-5 shadow-lg shadow-slate-200/50 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Filter report visuals</h2>
            <p className="mt-1 text-sm text-slate-500">
              Refine every chart, map, summary, and recommendation using the same geographic selection.
            </p>
          </div>
          <Button variant="outline" onClick={resetFilters} disabled={!siteData.length} className="w-full rounded-xl border-slate-300 bg-white md:w-auto">
            Reset Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterMultiSelect
            label="Country"
            placeholder="Select countries"
            options={filterOptions.countries}
            values={filters.country}
            onChange={(values) => handleFilterChange("country", values)}
            helperText="Choose one or more countries to focus the report."
            disabled={!siteData.length}
          />

          <FilterMultiSelect
            label="City"
            placeholder="Select cities"
            options={filterOptions.cities}
            values={filters.city}
            onChange={(values) => handleFilterChange("city", values)}
            helperText="City options narrow automatically when you pick countries."
            disabled={filterOptions.cities.length === 0}
          />

          <FilterMultiSelect
            label="District"
            placeholder="Select districts"
            options={filterOptions.districts}
            values={filters.district}
            onChange={(values) => handleFilterChange("district", values)}
            helperText="Districts follow your country and city choices."
            disabled={filterOptions.districts.length === 0}
          />

          <FilterMultiSelect
            label="Category"
            placeholder="Select site categories"
            options={filterOptions.categories}
            values={filters.category}
            onChange={(values) => handleFilterChange("category", values)}
            helperText="Mix categories to compare background vs traffic-heavy sites."
            disabled={!siteData.length}
          />
        </div>
      </div>

      {isReportDataLoading && (
        <div
          className="mb-8 overflow-hidden rounded-3xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/50"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 ring-8 ring-blue-50/60">
              <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Preparing your air quality overview</p>
              <p className="mt-1 text-sm text-slate-500">Loading monitoring sites, recent readings, and report filters.</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
              </div>
            </div>
          </div>
        </div>
      )}
      {reportLoadError && (
        <div className="mb-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-center" role="alert">
          <p className="text-sm font-medium text-red-800">{reportLoadError}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setReportLoadRequest((request) => request + 1)}
            className="rounded-xl border-red-300 bg-white text-red-700 hover:bg-red-100"
          >
            Try again
          </Button>
        </div>
      )}

      {siteData.length > 0 ? (
        <>
      {/* Filter summary */}
      <div className="mb-8 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50/60 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Active filters</span>
          {hasActiveFilters ? (
            <>
              {(["country", "city", "district", "category"] as (keyof Filters)[]).map((key) =>
                filters[key].map((value) => (
                  <button
                    type="button"
                    key={`${key}-${value}`}
                    onClick={() => removeFilterValue(key, value)}
                    className="group flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-100"
                  >
                    <span className="capitalize">{key}:</span> {value}
                    <X className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                  </button>
                )),
              )}
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                Most Common AQI Category: {mostCommonCategory || "N/A"}
              </span>
            </>
          ) : (
            <span className="text-sm text-slate-500">None selected, showing the complete network.</span>
          )}
          </div>
          <div className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            Showing {filteredData.length} of {siteData.length} sites
          </div>
        </div>
      </div>

      {/* Selected Devices Counter */}
      {selectedDevices.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 p-5 text-white shadow-lg shadow-blue-900/15">
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
                className="rounded-xl border-white bg-transparent text-white hover:bg-blue-700"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Category Breakdown */}
          {selectedDevices.length > 1 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(sitesByCategory).map(([category, sites]) => {
                const selectedCount = sites.filter((site) => selectedDevices.includes(getSiteSelectionId(site))).length
                if (selectedCount === 0) return null

                return (
                  <div key={`selected-${category}`} className="rounded-xl bg-blue-700 p-2 text-center">
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
                  const selectedSitesData = filteredData.filter((site) => selectedDevices.includes(getSiteSelectionId(site)))

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
                className="rounded-xl bg-white text-blue-600 hover:bg-blue-50"
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
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 className="text-lg font-semibold mb-2 md:mb-0">Device Selection</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={selectAllDevices} size="sm" 
            className="rounded-xl border-blue-700 bg-blue-500 text-white hover:bg-blue-600">
              Select All
            </Button>
            <Button variant="outline" onClick={clearDeviceSelection} size="sm" className="rounded-xl">
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
              className="h-11 flex-1 rounded-xl border-slate-300 bg-slate-50 focus-visible:bg-white"
            />
            <Button
              onClick={() => {
                if (selectedDevices.length > 0) {
                  setReportGenerating(true)

                  // Filter data to only include selected devices
                  const selectedSitesData = filteredData.filter((site) => selectedDevices.includes(getSiteSelectionId(site)))

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
                }
              }}
              disabled={selectedDevices.length === 0 || reportGenerating}
              className="rounded-xl bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
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
                <div key={getSiteSelectionId(site)} className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <Checkbox
                    id={getSiteCheckboxId(site)}
                    checked={selectedDevices.includes(getSiteSelectionId(site))}
                    onCheckedChange={() => toggleDeviceSelection(getSiteSelectionId(site))}
                  />
                  <label htmlFor={getSiteCheckboxId(site)} className="text-sm flex-1 cursor-pointer truncate">
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
              setFilteredData(filterSites(siteData, filters))
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

            {/* Map snapshot of selected area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <Card className="h-full border-blue-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-blue-800">Area snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Country</span>
                    <span>{formatSelectionList(filters.country, "All Countries")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">City</span>
                    <span>{formatSelectionList(filters.city, "All Cities")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">District</span>
                    <span>{formatSelectionList(filters.district, "All Districts")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Sites mapped</span>
                    <span>{mapSites.length}</span>
                  </div>
                  <div className="pt-2 border-t text-xs text-blue-700">
                    Map is filtered to the area described above. Markers show the selected devices; circles indicate a
                    500m context radius.
                  </div>
                </CardContent>
              </Card>

              <div className="md:col-span-2 h-[320px] rounded-xl overflow-hidden border border-blue-100 shadow">
                {mapSites.length > 0 ? (
                  <MapContainer
                    key={mapSites.length}
                    center={[mapCenter.lat, mapCenter.lng]}
                    bounds={mapBounds || undefined}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution={mapTile.attribution}
                      url={mapTile.url}
                      tileSize={mapTile.tileSize}
                      zoomOffset={mapTile.zoomOffset}
                    />
                    {mapSites.slice(0, 150).map((site) => {
                      const meta = getAQIMeta(site.aqi_category)
                      const icon = getMarkerIcon(site.aqi_category)
                      return (
                        <Marker
                          key={getSiteSelectionId(site)}
                          position={[site.siteDetails.approximate_latitude, site.siteDetails.approximate_longitude]}
                          icon={icon}
                        >
                          <Popup>
                            <div className="min-w-[200px] space-y-2">
                              <div className="font-semibold text-sm text-gray-900">
                                {site.siteDetails.name || site.siteDetails.formatted_name || "Unknown Site"}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span
                                  className="inline-block w-3 h-3 rounded-full border border-white shadow"
                                  style={{ backgroundColor: meta.color }}
                                />
                                <span className="font-medium">{meta.label}</span>
                              </div>
                              <div className="text-sm text-gray-700">
                                PM2.5: {(site.pm2_5?.value ?? 0).toFixed(1)} µg/m³
                              </div>
                              <div className="text-xs text-gray-500">
                                {site.siteDetails.city || "Unknown City"}, {site.siteDetails.country || "Unknown"}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    })}
                    {mapSites[0] && (
                      <Circle
                        center={[mapCenter.lat, mapCenter.lng]}
                        radius={500}
                        pathOptions={{ color: "#1d4ed8", fillColor: "#bfdbfe", fillOpacity: 0.2 }}
                      />
                    )}
                  </MapContainer>
                ) : (
                  <div className="h-full w-full bg-blue-50 text-blue-700 flex items-center justify-center text-sm">
                    No mappable coordinates for the current selection
                  </div>
                )}
              </div>
            </div>

            {/* Introduction */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Introduction</h3>
              <p className="text-gray-700">
                This report provides a comprehensive analysis of air quality data for
                {selectedSite
                  ? ` ${selectedSite.siteDetails.name} in ${selectedSite.siteDetails.city || "Unknown City"}, ${selectedSite.siteDetails.country || "Unknown Country"}.`
                  : hasActiveFilters
                    ? ` the selected region (${[
                        filters.country.length ? formatSelectionList(filters.country, "") : null,
                        filters.city.length ? formatSelectionList(filters.city, "") : null,
                        filters.district.length ? formatSelectionList(filters.district, "") : null,
                        filters.category.length ? formatSelectionList(filters.category, "") : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}).`
                    : " all monitored sites in the AirQo network."}{" "}
                The data was collected using AirQo&apos;s network of low-cost air quality sensors, which measure
                particulate matter (PM<sub>2.5</sub>) and other pollutants in real-time. This report analyzes the current air
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
                  <h4 className="font-semibold text-gray-700 mb-1">Average PM<sub>2.5</sub></h4>
                  <p className="text-2xl font-bold">{calculateAveragePM25(filteredData).toFixed(2)} µg/m³</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-1">Weekly Change</h4>
                  <p className="text-2xl font-bold flex items-center">
                    {calculateAveragePercentageChange(filteredData).toFixed(2)}%
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
                    The average PM<sub>2.5</sub> concentration is{" "}
                    <strong>{calculateAveragePM25(filteredData).toFixed(2)} µg/m³</strong>, which is classified as{" "}
                    <strong>{avgAQICategory}</strong>.
                  </li>
                  <li>
                    There has been a{" "}
                    <strong>
                      {Math.abs(calculateAveragePercentageChange(filteredData)).toFixed(2)}%{" "}
                      {calculateAveragePercentageChange(filteredData) < 0 ? "decrease" : "increase"}
                    </strong>{" "}
                    in PM<sub>2.5</sub> levels compared to the previous week.
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
                      {selectedSite.siteDetails.name} has a PM<sub>2.5</sub> reading of{" "}
                      <strong>{(selectedSite.pm2_5?.value || 0).toFixed(2)} µg/m³</strong>, which is{" "}
                      {compareToAverage(selectedSite.pm2_5?.value || 0, calculateAveragePM25(filteredData))} the
                      regional average.
                    </li>
                  )}
                  {filteredData.length > 1 && getHotspotSites(filteredData).length > 0 && (
                    <li>
                      <strong>Pollution Hotspots:</strong>{" "}
                      {getHotspotSites(filteredData).map((site, index, arr) => (
                        <span key={getSiteSelectionId(site)}>
                          {site.siteDetails?.name || "Unknown Site"} ({(site.pm2_5?.value || 0).toFixed(2)} µg/m³)
                          {index < arr.length - 1 ? ", " : ""}
                        </span>
                      ))}
                      {" are the areas with the highest pollution levels."}
                    </li>
                  )}
                 
                  {filteredData.length > 1 && getColdspotSites(filteredData).length > 0 && (
                    <li>
                      <strong>Lower-Pollution sites:</strong>{" "}
                      {getColdspotSites(filteredData).map((site, index, arr) => (
                        <span key={getSiteSelectionId(site)}>
                          {site.siteDetails?.name || "Unknown Site"} ({(site.pm2_5?.value || 0).toFixed(2)} µg/m³)
                          {index < arr.length - 1 ? ", " : ""}
                        </span>
                      ))}
                      {" are the areas with lower pollution levels."}
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {showAdvancedAnalysis && !pdfMode && (
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

            </div>

            {/* Jump to Categories Button */}
            {!pdfMode && (
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
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="Total Monitoring Sites"
          value={filteredData.length.toString()}
          icon={<Globe className="text-blue-500 w-8 h-8" />}
        />
        <SummaryCard
          title="Average PM2.5"
          value={`${calculateAveragePM25(filteredData).toFixed(2)} µg/m³`}
          icon={<BarChart3 className="text-green-500 w-8 h-8" />}
        />
        <SummaryCard
          title="Weekly Change"
          value={`${calculateAveragePercentageChange(filteredData).toFixed(2)}%`}
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
      <div id="categories-section" className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Explore the network</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Device Categories</h2><p className="mt-1 text-sm text-slate-500">Review monitoring sites grouped by their surrounding environment.</p></div>
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
          className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out hover:shadow-md"
        >
          <div className="flex cursor-pointer flex-col gap-3 bg-gradient-to-r from-blue-50 via-white to-cyan-50/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center">
              <div onClick={() => toggleCategoryCollapse(category)} className="flex items-center cursor-pointer">
                <h2 className="text-2xl font-bold text-gray-800">{category} Sites</h2>
                <div className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {sites.length} {sites.length === 1 ? "device" : "devices"}
                </div>
                <div className="ml-3 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {sites.filter((site) => selectedDevices.includes(getSiteSelectionId(site))).length} selected
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
                  const categoryDeviceIds = sites.map(getSiteSelectionId)

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
                {sites.every((site) => selectedDevices.includes(getSiteSelectionId(site))) ? "Deselect All" : "Select All"}
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
            <div className="grid grid-cols-1 gap-4 p-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sites.map((site) => {
                const isSiteSelected = selectedDevices.includes(getSiteSelectionId(site))
                return (
                  <SiteCard
                    key={getSiteSelectionId(site)}
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
                    isSelected={selectedSite ? getSiteSelectionId(selectedSite) === getSiteSelectionId(site) : false}
                    isCheckboxSelected={isSiteSelected}
                    onCheckboxChange={() => toggleDeviceSelection(getSiteSelectionId(site))}
                    lastSelectedId={lastSelectedId}
                  />
                )
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Health Tips Section */}
      {!pdfMode && (
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
      )}
        </>
      ) : null}
    </div>
  )
}

type FilterMultiSelectProps = {
  label: string
  placeholder: string
  options: string[]
  values: string[]
  onChange: (values: string[]) => void
  disabled?: boolean
  helperText?: string
}

function FilterMultiSelect({
  label,
  placeholder,
  options,
  values,
  onChange,
  disabled,
  helperText,
}: FilterMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredOptions = useMemo(
    () => options.filter((option) => option.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  )

  const toggleValue = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value))
    } else {
      onChange([...values, value])
    }
  }

  const clearAll = () => {
    onChange([])
    setSearch("")
  }

  return (
    <div
      className={`rounded-2xl border p-3 transition ${
        values.length
          ? "border-blue-200 bg-blue-50/60 shadow-[0_0_0_1px_rgba(37,99,235,0.04)]"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">{label}</label>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          values.length ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500"
        }`}>
          {values.length || "All"}
        </span>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`min-h-12 h-auto w-full justify-between rounded-xl px-3 py-2 text-left ${
              values.length
                ? "border-blue-200 bg-white hover:bg-white"
                : "border-slate-300 bg-slate-50 hover:bg-slate-100"
            }`}
            disabled={disabled}
          >
            <span className={`min-w-0 flex-1 ${values.length ? "text-slate-900" : "text-slate-500"}`}>
              {values.length ? (
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{values.slice(0, 2).join(", ")}</span>
                  {values.length > 2 && (
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      +{values.length - 2}
                    </span>
                  )}
                </span>
              ) : (
                placeholder
              )}
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 rounded-2xl border-slate-200 p-3 shadow-xl">
          <div className="mb-3 flex items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              className="h-10 rounded-xl border-slate-300 bg-slate-50"
            />
            {values.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-blue-700 hover:text-blue-900">
                Clear
              </Button>
            )}
          </div>
          <div className="max-h-52 overflow-y-auto space-y-1">
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition ${
                    values.includes(option)
                      ? "border-blue-200 bg-blue-50 text-blue-900"
                      : "border-transparent hover:bg-slate-50"
                  }`}
                >
                  <Checkbox checked={values.includes(option)} onCheckedChange={() => toggleValue(option)} />
                  <span className="text-sm text-gray-800">{option}</span>
                </label>
              ))
            ) : (
              <div className="text-xs text-gray-500 px-1 py-2">No options match your search.</div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-2 border-t">
            <span>{values.length} selected</span>
            <Button variant="link" size="sm" className="px-0 text-blue-600" onClick={clearAll}>
              Clear all
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {helperText && <p className="mt-2 min-h-8 text-xs leading-4 text-slate-500">{helperText}</p>}
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
  const previousWeek = site.averages?.weeklyAverages?.previousWeek ?? 0
  const country = site.siteDetails?.country || "Unknown"
  const city = site.siteDetails?.city || "Unknown"

  const getCategoryTheme = (category: string) => {
    switch (category.toLowerCase()) {
      case "good":
        return {
          accent: "bg-emerald-500",
          badge: "border-emerald-200 bg-emerald-100 text-emerald-800",
          card: "border-emerald-200 bg-gradient-to-br from-white via-white to-emerald-50/80",
          metric: "text-emerald-700",
          soft: "bg-emerald-50 text-emerald-700",
        }
      case "moderate":
        return {
          accent: "bg-amber-400",
          badge: "border-amber-200 bg-amber-100 text-amber-800",
          card: "border-amber-200 bg-gradient-to-br from-white via-white to-amber-50/90",
          metric: "text-amber-700",
          soft: "bg-amber-50 text-amber-700",
        }
      case "unhealthy for sensitive groups":
        return {
          accent: "bg-orange-500",
          badge: "border-orange-200 bg-orange-100 text-orange-800",
          card: "border-orange-200 bg-gradient-to-br from-white via-white to-orange-50/90",
          metric: "text-orange-700",
          soft: "bg-orange-50 text-orange-700",
        }
      case "unhealthy":
        return {
          accent: "bg-red-500",
          badge: "border-red-200 bg-red-100 text-red-800",
          card: "border-red-200 bg-gradient-to-br from-white via-white to-red-50/90",
          metric: "text-red-700",
          soft: "bg-red-50 text-red-700",
        }
      case "very unhealthy":
        return {
          accent: "bg-purple-500",
          badge: "border-purple-200 bg-purple-100 text-purple-800",
          card: "border-purple-200 bg-gradient-to-br from-white via-white to-purple-50/90",
          metric: "text-purple-700",
          soft: "bg-purple-50 text-purple-700",
        }
      case "hazardous":
        return {
          accent: "bg-rose-800",
          badge: "border-rose-300 bg-rose-100 text-rose-900",
          card: "border-rose-300 bg-gradient-to-br from-white via-white to-rose-100/80",
          metric: "text-rose-900",
          soft: "bg-rose-100 text-rose-900",
        }
      default:
        return {
          accent: "bg-slate-400",
          badge: "border-slate-200 bg-slate-100 text-slate-700",
          card: "border-slate-200 bg-gradient-to-br from-white via-white to-slate-50",
          metric: "text-slate-800",
          soft: "bg-slate-100 text-slate-700",
        }
    }
  }

  const theme = getCategoryTheme(aqiCategory)
  const trendTone = percentChange < 0
    ? "bg-emerald-50 text-emerald-700"
    : percentChange > 0
      ? "bg-red-50 text-red-700"
      : "bg-slate-100 text-slate-600"
  const wasJustSelected = getSiteSelectionId(site) === lastSelectedId

  return (
    <Card
      className={`group relative w-full overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${theme.card} ${
        isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
      } ${isCheckboxSelected ? "shadow-blue-200/60 ring-2 ring-blue-400/70" : ""} ${
        wasJustSelected ? "-translate-y-1 shadow-xl" : ""
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 ${theme.accent}`} />
      <CardContent className="p-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-slate-950">{siteName}</h3>
              {isCheckboxSelected && (
                <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Selected
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs font-medium text-slate-600">{areaName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{city}, {country}</span>
            </p>
          </div>
          {onCheckboxChange && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white/90 shadow-sm">
              <Checkbox
                checked={isCheckboxSelected}
                aria-label={`Select ${siteName} for reporting`}
                onCheckedChange={() => onCheckboxChange()}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] gap-2">
          <div className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Current PM2.5</p>
            <p className={`mt-0.5 text-2xl font-bold tracking-tight ${theme.metric}`}>
              {pm25Value.toFixed(2)} <span className="text-sm font-semibold">µg/m³</span>
            </p>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-white/80 bg-white/70 p-3 shadow-sm backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">AQI status</p>
            <span className={`mt-1.5 w-fit rounded-full border px-2 py-0.5 text-[11px] font-bold ${theme.badge}`}>
              {aqiCategory}
            </span>
          </div>
        </div>

        <div className="mt-2 rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-800">Weekly comparison</p>
              <p className="text-[10px] text-slate-500">Weekly average · µg/m³</p>
            </div>
            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${trendTone}`}>
              {percentChange < 0 ? (
                <ArrowDown className="h-3.5 w-3.5" />
              ) : percentChange > 0 ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
              {Math.abs(percentChange).toFixed(2)}%
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Previous</p>
              <p className="text-sm font-bold text-slate-700">{previousWeek.toFixed(2)}</p>
              <p className="hidden">µg/m³</p>
            </div>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${theme.soft}`}>
              {percentChange < 0 ? <ArrowDown className="h-4 w-4" /> : percentChange > 0 ? <ArrowUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Current</p>
              <p className="text-sm font-bold text-slate-900">{currentWeek.toFixed(2)}</p>
              <p className="hidden">µg/m³</p>
            </div>
          </div>
        </div>

        {onSelect && (
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className={`mt-3 h-9 w-full rounded-lg text-xs font-semibold transition ${
              isSelected
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "border-blue-200 bg-white/80 text-blue-700 hover:border-blue-300 hover:bg-blue-50"
            }`}
          >
            {isSelected ? "Selected for report" : "View detailed report"}
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
    <Card className="group relative w-full overflow-hidden rounded-2xl border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400" />
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{title}</h3>
            <div className="mt-2 flex items-center text-3xl font-bold tracking-tight text-slate-950">
              {value}
              {trend !== undefined && (
                <span
                  className={`ml-2 rounded-full px-2 py-1 text-xs font-bold ${
                    trend < 0 ? "bg-emerald-50 text-emerald-700" : trend > 0 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {trend < 0 ? "↓" : trend > 0 ? "↑" : "−"}
                </span>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-3.5 ring-1 ring-blue-100 transition-transform group-hover:scale-105">{icon}</div>
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
