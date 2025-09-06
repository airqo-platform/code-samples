"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Pie,
  PieChart,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts"
import { useState, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import html2canvas from "html2canvas"
import type { SiteData } from "@/lib/types"
import { BarChart3, LineChartIcon, PieChartIcon, Download, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react"

// AQI colors
const AQI_COLORS: Record<string, string> = {
  Good: "#A8E05F",
  Moderate: "#FDD64B",
  "Unhealthy for Sensitive Groups": "#FF9B57",
  Unhealthy: "#FE6A69",
  "Very Unhealthy": "#A97ABC",
  Hazardous: "#A87383",
  Unknown: "#CCCCCC",
}

// Custom Dot component for dynamic coloring in LineChart
const CustomDot = ({ cx, cy, payload }: { cx?: number; cy?: number; payload?: any }) => {
  if (!cx || !cy || !payload) return null
  return <circle cx={cx} cy={cy} r={4} fill={payload.color || "#CCCCCC"} stroke="#3b82f6" strokeWidth={1} />
}

// PM2.5 Bar Chart
export function PM25BarChart({ sites }: { sites: SiteData[] }) {
  const [siteLimit, setSiteLimit] = useState(7)
  const [chartType, setChartType] = useState<"bar" | "line">("bar")
  const [downloadValue, setDownloadValue] = useState<"none" | "csv" | "json" | "png">("none")
  const [sortOrder, setSortOrder] = useState<"highest" | "lowest" | "none">("none")
  const chartRef = useRef<HTMLDivElement>(null)

  const handleSiteLimitChange = (value: string) => {
    setSiteLimit(value === "all" ? sites.length : Number.parseInt(value, 10))
  }

  const handleDownload = async (type: "csv" | "json" | "png") => {
    if (type === "csv") {
      const dataStr = "Name,PM2.5,Category\n" + displaySites.map((s) => `${s.name},${s.pm25},${s.category}`).join("\n")
      const blob = new Blob([dataStr], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "pm25_chart.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "json") {
      const dataStr = JSON.stringify(displaySites, null, 2)
      const blob = new Blob([dataStr], { type: "application/json;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "pm25_chart.json"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "png" && chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
          width: chartRef.current.offsetWidth,
          height: chartRef.current.offsetHeight,
        })

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "pm25_chart.png"
            a.click()
            URL.revokeObjectURL(url)
          }
        }, "image/png")
      } catch (error) {
        console.error("Error generating PNG:", error)
        return
      }
    }
  }

  const handleDownloadChange = (value: "none" | "csv" | "json" | "png") => {
    setDownloadValue(value)
    if (value !== "none") {
      handleDownload(value)
      setDownloadValue("none")
    }
  }

  const sortedSites = [...sites].sort((a, b) => {
    const aValue = a.pm2_5?.value ? Number(a.pm2_5.value) : 0
    const bValue = b.pm2_5?.value ? Number(b.pm2_5.value) : 0
    if (sortOrder === "highest") return bValue - aValue
    if (sortOrder === "lowest") return aValue - bValue
    return 0
  })

  const displaySites = sortedSites.slice(0, siteLimit).map((site) => ({
    name: site.siteDetails?.name || "Unknown",
    pm25: site.pm2_5?.value ? Number(site.pm2_5.value).toFixed(2) : "0.00",
    category: site.aqi_category || "Unknown",
    color: AQI_COLORS[site.aqi_category || "Unknown"] || "#CCCCCC",
  }))

  return (
    <Card className="w-full shadow-lg border-gray-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <CardTitle className="text-lg md:text-xl flex items-center gap-2 text-gray-800">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          PM<sub>2.5</sub> Levels by Site
        </CardTitle>
        <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 min-w-fit">Sites:</span>
            <Select onValueChange={handleSiteLimitChange} defaultValue="7">
              <SelectTrigger className="w-full md:w-[140px] h-9 border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Sites to display" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 sites</SelectItem>
                <SelectItem value="10">10 sites</SelectItem>
                <SelectItem value="15">15 sites</SelectItem>
                <SelectItem value="20">20 sites</SelectItem>
                <SelectItem value="all">All ({sites.length})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 min-w-fit">Type:</span>
            <Select onValueChange={(v: string) => setChartType(v as "bar" | "line")} defaultValue="bar">
              <SelectTrigger className="w-full md:w-[120px] h-9 border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Bar
                  </div>
                </SelectItem>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <LineChartIcon className="h-4 w-4" />
                    Line
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 min-w-fit">Sort:</span>
            <Select onValueChange={(v: string) => setSortOrder(v as "highest" | "lowest" | "none")} defaultValue="none">
              <SelectTrigger className="w-full md:w-[140px] h-9 border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    No Sort
                  </div>
                </SelectItem>
                <SelectItem value="highest">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    High to Low
                  </div>
                </SelectItem>
                <SelectItem value="lowest">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Low to High
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 min-w-fit">Export:</span>
            <Select value={downloadValue} onValueChange={handleDownloadChange}>
              <SelectTrigger className="w-full md:w-[120px] h-9 border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Download" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </div>
                </SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {siteLimit > 7 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-sm flex items-center gap-2">
              <span className="text-amber-600">⚠️</span>
              Displaying more than 7 sites may affect chart readability on smaller screens.
            </p>
          </div>
        )}
        <div className="h-[300px] md:h-[350px]" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={displaySites} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 10 }} />
                <YAxis
                  label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft", fontSize: 10 }}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value) => [`${value} µg/m³`, "PM2.5"]}
                  labelFormatter={(label) => `Site: ${label}`}
                />
                <Bar dataKey="pm25" name="PM2.5 Level" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {displaySites.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={displaySites} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 10 }} />
                <YAxis
                  label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft", fontSize: 10 }}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value) => [`${value} µg/m³`, "PM2.5"]}
                  labelFormatter={(label) => `Site: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="pm25"
                  name="PM2.5 Level"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={<CustomDot />}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function AQICategoryChart({ sites }: { sites: SiteData[] }) {
  const categoryCount: Record<string, number> = {}
  sites.forEach((site) => {
    const category = site.aqi_category || "Unknown"
    categoryCount[category] = (categoryCount[category] || 0) + 1
  })

  const chartData = Object.entries(categoryCount).map(([name, value]) => ({
    name,
    value,
    color: AQI_COLORS[name] || "#CCCCCC",
  }))

  const [chartType, setChartType] = useState<"pie" | "bar">("pie")
  const [downloadValue, setDownloadValue] = useState<"none" | "csv" | "json" | "png">("none")
  const chartRef = useRef<HTMLDivElement>(null)

  const handleDownload = async (type: "csv" | "json" | "png") => {
    if (type === "csv") {
      const dataStr = "Category,Count\n" + chartData.map((d) => `${d.name},${d.value}`).join("\n")
      const blob = new Blob([dataStr], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "aqi_category_chart.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "json") {
      const dataStr = JSON.stringify(chartData, null, 2)
      const blob = new Blob([dataStr], { type: "application/json;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "aqi_category_chart.json"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "png" && chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
          width: chartRef.current.offsetWidth,
          height: chartRef.current.offsetHeight,
        })

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "aqi_category_chart.png"
            a.click()
            URL.revokeObjectURL(url)
          }
        }, "image/png")
      } catch (error) {
        console.error("Error generating PNG:", error)
      }
    }
  }

  const handleDownloadChange = (value: "none" | "csv" | "json" | "png") => {
    setDownloadValue(value)
    if (value !== "none") {
      handleDownload(value)
      setDownloadValue("none")
    }
  }

  return (
    <Card className="w-full shadow-lg border-gray-200">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
        <CardTitle className="text-lg md:text-xl flex items-center gap-2 text-gray-800">
          <PieChartIcon className="h-5 w-5 text-green-600" />
          AQI Category Distribution
        </CardTitle>
        <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 min-w-fit">Type:</span>
            <Select onValueChange={(v: string) => setChartType(v as "pie" | "bar")} defaultValue="pie">
              <SelectTrigger className="w-full md:w-[120px] h-9 border-gray-300 focus:border-green-500">
                <SelectValue placeholder="Chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4" />
                    Pie
                  </div>
                </SelectItem>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Bar
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 min-w-fit">Export:</span>
            <Select value={downloadValue} onValueChange={handleDownloadChange}>
              <SelectTrigger className="w-full md:w-[120px] h-9 border-gray-300 focus:border-green-500">
                <SelectValue placeholder="Download" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </div>
                </SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[300px] md:h-[350px]" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} sites`, "Count"]} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 10 }} />
                <YAxis
                  label={{ value: "Count", angle: -90, position: "insideLeft", fontSize: 10 }}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value) => [`${value} sites`, "Count"]}
                  labelFormatter={(label) => `Category: ${label}`}
                />
                <Bar dataKey="value" name="Count" fill="#8884d8" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Weekly Comparison Line Chart
export function WeeklyComparisonChart({ sites }: { sites: SiteData[] }) {
  const [siteLimit, setSiteLimit] = useState(7)
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const [downloadValue, setDownloadValue] = useState<"none" | "csv" | "json" | "png">("none")
  const [sortOrder, setSortOrder] = useState<"highest" | "lowest" | "none">("none")
  const chartRef = useRef<HTMLDivElement>(null)

  const sitesWithData = sites.filter(
    (site) =>
      site.averages?.weeklyAverages?.currentWeek !== undefined &&
      site.averages?.weeklyAverages?.previousWeek !== undefined,
  )

  const handleSiteLimitChange = (value: string) => {
    setSiteLimit(value === "all" ? sitesWithData.length : Number.parseInt(value, 10))
  }

  const handleDownload = async (type: "csv" | "json" | "png") => {
    if (type === "csv") {
      const dataStr =
        "Name,Current Week,Previous Week,Change\n" +
        chartData.map((d) => `${d.name},${d.current},${d.previous},${d.change}`).join("\n")
      const blob = new Blob([dataStr], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "weekly_comparison_chart.csv"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "json") {
      const dataStr = JSON.stringify(chartData, null, 2)
      const blob = new Blob([dataStr], { type: "application/json;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "weekly_comparison_chart.json"
      a.click()
      URL.revokeObjectURL(url)
    } else if (type === "png" && chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
          width: chartRef.current.offsetWidth,
          height: chartRef.current.offsetHeight,
        })

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "weekly_comparison_chart.png"
            a.click()
            URL.revokeObjectURL(url)
          }
        }, "image/png")
      } catch (error) {
        console.error("Error generating PNG:", error)
      }
    }
  }

  const handleDownloadChange = (value: "none" | "csv" | "json" | "png") => {
    setDownloadValue(value)
    if (value !== "none") {
      handleDownload(value)
      setDownloadValue("none")
    }
  }

  const sortedSites = [...sitesWithData].sort((a, b) => {
    const aValue = a.averages?.weeklyAverages?.currentWeek || 0
    const bValue = b.averages?.weeklyAverages?.currentWeek || 0
    if (sortOrder === "highest") return bValue - aValue
    if (sortOrder === "lowest") return aValue - bValue
    return 0
  })

  const displayData = sortedSites.slice(0, siteLimit)

  const chartData = displayData.map((site) => ({
    name: site.siteDetails?.name || "Unknown",
    current: site.averages?.weeklyAverages?.currentWeek || 0,
    previous: site.averages?.weeklyAverages?.previousWeek || 0,
    change: site.averages?.percentageDifference || 0,
  }))

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          Weekly PM<sub>2.5</sub> Comparison
        </CardTitle>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
          <Select onValueChange={handleSiteLimitChange} defaultValue="7">
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Sites to display" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="all">All ({sitesWithData.length})</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(v: string) => setChartType(v as "line" | "bar")} defaultValue="line">
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Chart type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Bar
                  </div>
                </SelectItem>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <LineChartIcon className="h-4 w-4" />
                    Line
                  </div>
                </SelectItem>
              </SelectContent>
          </Select>
          <Select onValueChange={(v: string) => setSortOrder(v as "highest" | "lowest" | "none")} defaultValue="none">
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    No Sort
                  </div>
                </SelectItem>
                <SelectItem value="highest">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    High to Low
                  </div>
                </SelectItem>
                <SelectItem value="lowest">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Low to High
                  </div>
                </SelectItem>
              </SelectContent>
          </Select>
          <Select value={downloadValue} onValueChange={handleDownloadChange}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Download" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </div>
              </SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {siteLimit > 7 && (
          <p className="text-yellow-600 text-xs md:text-sm mb-2">
            Warning: Displaying more than 7 sites may affect readability.
          </p>
        )}
        <div className="h-[250px] md:h-[300px]" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 10 }} />
                <YAxis
                  label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft", fontSize: 10 }}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip formatter={(value) => [`${value} µg/m³`, ""]} labelFormatter={(label) => `Site: ${label}`} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="current"
                  name="Current Week"
                  stroke="#0000FF"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="previous"
                  name="Previous Week"
                  stroke="#000000"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 10 }} />
                <YAxis
                  label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft", fontSize: 10 }}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip formatter={(value) => [`${value} µg/m³`, ""]} labelFormatter={(label) => `Site: ${label}`} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="current" name="Current Week" fill="#0000FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="previous" name="Previous Week" fill="#000000" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// AQI Index Visualization
export function AQIIndexVisual({ aqiCategory, pm25Value }: { aqiCategory: string; pm25Value: number }) {
  const [downloadValue, setDownloadValue] = useState<"none" | "png">("none")
  const chartRef = useRef<HTMLDivElement>(null)

  const getColorByCategory = (category: string): string => {
    return AQI_COLORS[category] || "#CCCCCC"
  }

  const getIndexPosition = (pm25: number): number => {
    if (pm25 <= 12) return 10
    if (pm25 <= 35.4) return 30
    if (pm25 <= 55.4) return 50
    if (pm25 <= 150.4) return 70
    if (pm25 <= 250.4) return 85
    return 95
  }

  const handleDownload = async (type: "png") => {
    if (type === "png" && chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
          width: chartRef.current.offsetWidth,
          height: chartRef.current.offsetHeight,
        })

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "aqi_index_chart.png"
            a.click()
            URL.revokeObjectURL(url)
          }
        }, "image/png")
      } catch (error) {
        console.error("Error generating PNG:", error)
      }
    }
  }

  const handleDownloadChange = (value: "none" | "png") => {
    setDownloadValue(value)
    if (value !== "none") {
      handleDownload(value)
      setDownloadValue("none")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Air Quality Index</CardTitle>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
          <Select value={downloadValue} onValueChange={handleDownloadChange}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Download" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </div>
              </SelectItem>
              <SelectItem value="png">PNG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center" ref={chartRef}>
          <div className="w-full h-6 md:h-8 bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 via-red-400 via-purple-400 to-red-800 rounded-lg mb-2 relative">
            <div
              className="absolute top-full w-0 h-0 border-l-6 md:border-l-8 border-r-6 md:border-r-8 border-b-6 md:border-b-8 border-l-transparent border-r-transparent border-b-gray-800"
              style={{ left: `${getIndexPosition(pm25Value)}%`, transform: "translateX(-50%)" }}
            ></div>
          </div>

          <div className="w-full flex justify-between text-[10px] md:text-xs text-gray-600 mb-4 flex-wrap gap-1">
            <span>Good</span>
            <span>Moderate</span>
            <span>Unhealthy for Sensitive Groups</span>
            <span>Unhealthy</span>
            <span>Very Unhealthy</span>
            <span>Hazardous</span>
          </div>

          <div className="flex items-center justify-center gap-4 mt-2">
            <div
              className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base"
              style={{ backgroundColor: getColorByCategory(aqiCategory) }}
            >
              {pm25Value.toFixed(0)}
            </div>
            <div className="text-center">
              <p className="text-base md:text-lg font-bold">{aqiCategory}</p>
              <p className="text-xs md:text-sm text-gray-600">{pm25Value.toFixed(1)} µg/m³</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
