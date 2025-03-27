"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card"
import {
  BarChart3,
  HeartPulse,
  Globe,
  ArrowDown,
  ArrowUp,
  Minus,
  FileText,
  Download,
  Printer,
  Share2,
} from "lucide-react"
import Navigation from "@/components/navigation/navigation"
import type { ReactNode } from "react"
import { getReportData } from "@/services/apiService"
import { Skeleton } from "@/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Button } from "@/ui/button"
import type { SiteData, Filters } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { format } from "date-fns"
import {
  PM25BarChart,
  AQICategoryChart,
  WeeklyComparisonChart,
  AQIIndexVisual,
} from "@/components/charts/AirQualityChart"

export default function ReportPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navigation />
      <ReportContent />
    </div>
  )
}

function ReportContent() {
  const [siteData, setSiteData] = useState<SiteData[]>([])
  const [filteredData, setFilteredData] = useState<SiteData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // Add a state to control whether the report is visible on the page
  const [showReportOnPage, setShowReportOnPage] = useState(false)

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

  // Generate PDF report
  const generatePDF = async () => {
    if (!reportRef.current) return

    setIsGeneratingPDF(true)

    try {
      const reportElement = reportRef.current
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

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
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (loading) {
    return <LoadingState />
  }

  if (error || siteData.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center px-4 py-12 space-y-10 text-center">
        <div className="text-3xl font-bold text-gray-800">{error || "No report data available"}</div>
        <p className="text-xl text-gray-600 max-w-2xl">
          We couldn't load the air quality report data. Please try again later.
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

    const parts = []
    if (filters.country) parts.push(filters.country)
    if (filters.city) parts.push(filters.city)
    if (filters.district) parts.push(filters.district)
    if (filters.category)
      parts.push(filters.category === "Urban Background" ? "Urban Background Sites" : `${filters.category} Sites`)

    return parts.length > 0 ? `Air Quality Report for ${parts.join(", ")}` : "Comprehensive Air Quality Report"
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
          {Object.entries(filters).some(([_, value]) => value) ? (
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
            </>
          ) : (
            <span className="text-blue-800 text-sm">None - showing all data</span>
          )}
        </div>
        <div className="mt-2 text-sm text-blue-700">
          Showing {filteredData.length} of {siteData.length} sites
        </div>
      </div>

      {/* Generate Report Button */}
      <div className="flex justify-end mb-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <FileText className="mr-2 h-4 w-4" />
              Generate Written Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{getReportTitle()}</DialogTitle>
              <DialogDescription>Generated on {format(new Date(), "MMMM d, yyyy")}</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="report" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="report">Written Report</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="report" className="p-4">
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
                      The data was collected using AirQo's network of low-cost air quality sensors, which measure
                      particulate matter (PM2.5) and other pollutants in real-time. This report analyzes the current air
                      quality status, compares it with previous periods, and provides health recommendations based on
                      the findings.
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
                        {Object.entries(getAQICategoryCounts(filteredData)).length > 1 && (
                          <li>
                            The most common air quality category is{" "}
                            <strong>{getMostCommonCategory(filteredData)}</strong>, representing{" "}
                            {(
                              (getAQICategoryCounts(filteredData)[getMostCommonCategory(filteredData)] /
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
                      </ul>
                    </div>
                  </div>

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
                    <p>
                      Data is based on readings from the AirQo monitoring network. For more information, visit
                      airqo.net.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="p-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Report Actions</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      Print Report
                    </Button>

                    <Button
                      className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        const reportTitle = getReportTitle()
                        const url = window.location.href
                        navigator.clipboard.writeText(`${reportTitle} - ${url}`)
                        alert("Link copied to clipboard!")
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Report
                    </Button>
                  </div>

                  <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-2">Select a Device for Detailed Report</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Choose a specific monitoring device to generate a detailed report for that location.
                    </p>

                    <Select
                      value={selectedSite?._id || ""}
                      onValueChange={(value) => {
                        const site = filteredData.find((s) => s._id === value)
                        setSelectedSite(site || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a device" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Devices</SelectItem>
                        {filteredData.map((site) => (
                          <SelectItem key={site._id} value={site._id}>
                            {site.siteDetails.name || site.siteDetails.formatted_name || "Unknown Site"} (
                            {site.siteDetails.city || "Unknown City"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
        <Button
          onClick={() => setShowReportOnPage(!showReportOnPage)}
          className="bg-green-600 hover:bg-green-700 text-white ml-2"
        >
          {showReportOnPage ? "Hide Report" : "View Report"}
        </Button>
      </div>

      {showReportOnPage && (
        <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
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
            </div>
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
                The data was collected using AirQo's network of low-cost air quality sensors, which measure particulate
                matter (PM2.5) and other pollutants in real-time. This report analyzes the current air quality status,
                compares it with previous periods, and provides health recommendations based on the findings.
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
                  {Object.entries(getAQICategoryCounts(filteredData)).length > 1 && (
                    <li>
                      The most common air quality category is <strong>{getMostCommonCategory(filteredData)}</strong>,
                      representing{" "}
                      {(
                        (getAQICategoryCounts(filteredData)[getMostCommonCategory(filteredData)] /
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
                </ul>
              </div>
            </div>

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

      {/* Site Categories */}
      {Object.entries(sitesByCategory).map(([category, sites]) => (
        <div key={category} className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{category} Sites</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <SiteCard
                key={site._id}
                site={site}
                onSelect={() => setSelectedSite(site)}
                isSelected={selectedSite?._id === site._id}
              />
            ))}
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
}: {
  site: SiteData
  onSelect?: () => void
  isSelected?: boolean
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
      className={`w-full shadow-md hover:shadow-lg transition-shadow ${getColorByCategory(aqiCategory)} ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-1">{siteName}</h3>
        <p className="text-sm mb-1">{areaName}</p>
        <p className="text-xs text-gray-600 mb-3">
          {city}, {country}
        </p>

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
              onSelect()
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

// Helper functions
function calculateAveragePM25(sites: SiteData[]): number {
  const validSites = sites.filter((site) => site.pm2_5?.value !== null && site.pm2_5?.value !== undefined)
  if (validSites.length === 0) return 0

  const sum = validSites.reduce((acc, site) => acc + (site.pm2_5?.value || 0), 0)
  return sum / validSites.length
}

function calculateAveragePercentageChange(sites: SiteData[]): number {
  const sitesWithAverages = sites.filter(
    (site) => site.averages?.percentageDifference !== undefined && site.averages?.percentageDifference !== null,
  )

  if (sitesWithAverages.length === 0) return 0

  const sum = sitesWithAverages.reduce((acc, site) => acc + (site.averages?.percentageDifference || 0), 0)
  return sum / sitesWithAverages.length
}

function getChangeIcon(percentChange: number) {
  if (percentChange < 0) {
    return <ArrowDown className="text-green-500 w-8 h-8" />
  } else if (percentChange > 0) {
    return <ArrowUp className="text-red-500 w-8 h-8" />
  } else {
    return <Minus className="text-gray-500 w-8 h-8" />
  }
}

// Get counts of sites by AQI category
function getAQICategoryCounts(sites: SiteData[]): Record<string, number> {
  const counts: Record<string, number> = {}

  sites.forEach((site) => {
    const category = site.aqi_category || "Unknown"
    counts[category] = (counts[category] || 0) + 1
  })

  return counts
}

// Get most common AQI category
function getMostCommonCategory(sites: SiteData[]): string {
  const counts = getAQICategoryCounts(sites)
  return Object.entries(counts).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
}

// Compare a value to the average
function compareToAverage(value: number, average: number): string {
  if (Math.abs(value - average) < 0.1) return "equal to"
  const percentDiff = ((value - average) / average) * 100

  if (percentDiff <= -20) return "significantly below"
  if (percentDiff < 0) return "below"
  if (percentDiff >= 20) return "significantly above"
  return "above"
}

// Get average AQI category based on PM2.5 values
function getAverageAQICategory(sites: SiteData[]): string {
  const avgPM25 = calculateAveragePM25(sites)

  if (avgPM25 <= 12) return "Good"
  if (avgPM25 <= 35.4) return "Moderate"
  if (avgPM25 <= 55.4) return "Unhealthy for Sensitive Groups"
  if (avgPM25 <= 150.4) return "Unhealthy"
  if (avgPM25 <= 250.4) return "Very Unhealthy"
  return "Hazardous"
}

// Get health implications based on AQI category
function getHealthImplications(aqiCategory: string): string {
  switch (aqiCategory.toLowerCase()) {
    case "good":
      return "Air quality is considered satisfactory, and air pollution poses little or no risk to public health."
    case "moderate":
      return "Air quality is acceptable; however, there may be some health concerns for a small number of people who are unusually sensitive to air pollution."
    case "unhealthy for sensitive groups":
      return "Members of sensitive groups may experience health effects. The general public is less likely to be affected."
    case "unhealthy":
      return "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects."
    case "very unhealthy":
      return "Health warnings of emergency conditions. The entire population is more likely to be affected."
    case "hazardous":
      return "Health alert: everyone may experience more serious health effects."
    default:
      return "Health implications cannot be determined due to insufficient data."
  }
}

// Get health recommendations based on AQI category
function getHealthRecommendations(aqiCategory: string): string[] {
  switch (aqiCategory.toLowerCase()) {
    case "good":
      return [
        "Enjoy outdoor activities",
        "Keep windows open for fresh air when weather permits",
        "Continue monitoring air quality for any changes",
      ]
    case "moderate":
      return [
        "Sensitive individuals should consider reducing prolonged outdoor exertion",
        "Keep windows closed during peak traffic hours",
        "Stay hydrated when outdoors",
      ]
    case "unhealthy for sensitive groups":
      return [
        "People with respiratory or heart conditions should limit outdoor activity",
        "Children and elderly should reduce prolonged or heavy exertion",
        "Consider using air purifiers indoors",
        "Keep windows closed",
      ]
    case "unhealthy":
      return [
        "Avoid prolonged outdoor activities",
        "Reschedule outdoor exercises",
        "Use masks (N95 or better) if outdoor activities are unavoidable",
        "Keep windows closed and use air purifiers",
        "Stay hydrated",
      ]
    case "very unhealthy":
      return [
        "Avoid all outdoor physical activities",
        "Stay indoors with windows closed",
        "Use air purifiers",
        "Wear masks (N95 or better) if going outdoors is necessary",
        "Check on elderly neighbors and those with respiratory conditions",
      ]
    case "hazardous":
      return [
        "Remain indoors and keep activity levels low",
        "Close all windows and doors",
        "Run air purifiers continuously",
        "Avoid driving to reduce pollution",
        "Follow public health emergency instructions",
        "Seek medical help if experiencing respiratory symptoms",
      ]
    default:
      return [
        "Monitor official air quality updates",
        "Follow general air quality guidelines",
        "Consult health professionals if experiencing respiratory symptoms",
      ]
  }
}

// Get policy recommendations based on AQI category and filters
function getPolicyRecommendations(aqiCategory: string, filters: Filters): string[] {
  const baseRecommendations = [
    "Continue air quality monitoring and expand the sensor network for better coverage",
    "Develop early warning systems for pollution events",
    "Promote public awareness about air quality and its health impacts",
  ]

  let specificRecommendations: string[] = []

  switch (aqiCategory.toLowerCase()) {
    case "good":
      specificRecommendations = [
        "Maintain current air quality management practices",
        "Develop preventive measures to maintain good air quality",
      ]
      break
    case "moderate":
      specificRecommendations = [
        "Implement traffic management strategies during peak hours",
        "Encourage use of public transportation and carpooling",
      ]
      break
    case "unhealthy for sensitive groups":
      specificRecommendations = [
        "Issue health advisories for sensitive populations",
        "Restrict high-emission industrial activities during unfavorable weather conditions",
        "Promote clean cooking technologies in residential areas",
      ]
      break
    case "unhealthy":
    case "very unhealthy":
    case "hazardous":
      specificRecommendations = [
        "Implement emergency response plans for severe pollution events",
        "Temporarily restrict vehicle use and industrial activities",
        "Provide clean air shelters for vulnerable populations",
        "Consider school closures and work-from-home policies during severe episodes",
      ]
      break
    default:
      specificRecommendations = [
        "Establish comprehensive air quality monitoring systems",
        "Develop baseline data for future policy interventions",
      ]
  }

  // Add location-specific recommendations if filters are applied
  if (filters.country || filters.city) {
    specificRecommendations.push(
      `Develop a localized air quality management plan for ${filters.city || filters.country}`,
      `Engage local stakeholders in air quality improvement initiatives`,
    )
  }

  return [...baseRecommendations, ...specificRecommendations]
}

// Get regional insights based on filters and data
function getRegionalInsights(filters: Filters, sites: SiteData[]): string {
  if (sites.length === 0) return "No data available for regional insights."

  const avgPM25 = calculateAveragePM25(sites)
  const percentChange = calculateAveragePercentageChange(sites)

  let regionText = ""
  if (filters.country) {
    regionText += filters.country
    if (filters.city) regionText += `, specifically in ${filters.city}`
    if (filters.district) regionText += ` (${filters.district} district)`
  } else {
    regionText = "the monitored region"
  }

  let categoryText = ""
  if (filters.category) {
    categoryText = `, particularly at ${filters.category} sites,`
  }

  let trendText = ""
  if (percentChange < -5) {
    trendText = "showing significant improvement"
  } else if (percentChange < 0) {
    trendText = "showing slight improvement"
  } else if (percentChange === 0) {
    trendText = "remaining stable"
  } else if (percentChange < 5) {
    trendText = "showing slight deterioration"
  } else {
    trendText = "showing significant deterioration"
  }

  return `Air quality in ${regionText}${categoryText} is currently averaging ${avgPM25.toFixed(1)} µg/m³ for PM2.5, ${trendText} compared to the previous week (${Math.abs(percentChange).toFixed(1)}% ${percentChange < 0 ? "decrease" : "increase"}). ${getAQIContextByValue(avgPM25)}`
}

// Get conclusion based on selected site, filters, and data
function getConclusion(selectedSite: SiteData | null, filters: Filters, sites: SiteData[]): string {
  if (selectedSite) {
    const pm25 = selectedSite.pm2_5?.value || 0
    const category = selectedSite.aqi_category || "Unknown"
    const percentChange = selectedSite.averages?.percentageDifference || 0

    return `The air quality at ${selectedSite.siteDetails.name} is currently ${category.toLowerCase()} with a PM2.5 reading of ${pm25.toFixed(1)} µg/m³. This represents a ${Math.abs(percentChange).toFixed(1)}% ${percentChange < 0 ? "improvement" : "deterioration"} compared to the previous week. ${getRecommendationByCategory(category)}`
  }

  const avgPM25 = calculateAveragePM25(sites)
  const category = getAverageAQICategory(sites)
  const percentChange = calculateAveragePercentageChange(sites)

  let regionText = "the monitored region"
  if (filters.country) {
    regionText = filters.country
    if (filters.city) regionText += `, specifically in ${filters.city}`
  }

  let categoryText = ""
  if (filters.category) {
    categoryText = ` at ${filters.category} sites`
  }

  return `Overall, the air quality in ${regionText}${categoryText} is ${category.toLowerCase()} with an average PM2.5 reading of ${avgPM25.toFixed(1)} µg/m³. This represents a ${Math.abs(percentChange).toFixed(1)}% ${percentChange < 0 ? "improvement" : "deterioration"} compared to the previous week. ${getRecommendationByCategory(category)}`
}

// Get AQI context by PM2.5 value
function getAQIContextByValue(pm25: number): string {
  if (pm25 <= 12) {
    return "This is considered good air quality according to international standards."
  } else if (pm25 <= 35.4) {
    return "This is considered moderate air quality, which may affect unusually sensitive individuals."
  } else if (pm25 <= 55.4) {
    return "This is considered unhealthy for sensitive groups, including children, elderly, and those with respiratory conditions."
  } else if (pm25 <= 150.4) {
    return "This is considered unhealthy and may cause health effects for the general population."
  } else if (pm25 <= 250.4) {
    return "This is considered very unhealthy and may cause significant health effects for all groups."
  } else {
    return "This is considered hazardous and may cause serious health effects for the entire population."
  }
}

// Get recommendation by AQI category
function getRecommendationByCategory(category: string): string {
  switch (category.toLowerCase()) {
    case "good":
      return "Residents can continue normal outdoor activities."
    case "moderate":
      return "Unusually sensitive people should consider reducing prolonged outdoor activities."
    case "unhealthy for sensitive groups":
      return "Sensitive groups should reduce outdoor activities and monitor their health."
    case "unhealthy":
      return "Everyone should reduce outdoor activities, especially those with respiratory conditions."
    case "very unhealthy":
      return "Everyone should avoid outdoor activities and use protective measures when outdoors."
    case "hazardous":
      return "Everyone should stay indoors and follow emergency health advisories."
    default:
      return "Follow general air quality guidelines and stay informed about changes."
  }
}

