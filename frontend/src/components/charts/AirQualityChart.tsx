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
import type { SiteData } from "@/lib/types"
import { useState, useRef } from "react"
import html2canvas from "html2canvas"
import { Button } from "@/ui/button"

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

// PM2.5 Bar/Line Chart 
export function PM25BarChart({ sites }: { sites: SiteData[] }) {
  const [chartType, setChartType] = useState<"bar" | "line">("bar")
  const chartRef = useRef<HTMLDivElement>(null)

  // Take up to 10 sites for readability
  const displaySites = sites.slice(0, 10).map((site) => ({
    name: site.siteDetails?.name || "Unknown",
    pm25: site.pm2_5?.value ? Number(site.pm2_5.value).toFixed(2) : "0.00",
    category: site.aqi_category || "Unknown",
  }))

  const handleDownload = () => {
    if (chartRef.current) {
      html2canvas(chartRef.current).then((canvas) => {
        const link = document.createElement("a")
        link.download = `pm25-${chartType}-chart.png`
        link.href = canvas.toDataURL("image/png")
        link.click()
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>PM2.5 Levels by Site</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4 space-x-2">
          <Button onClick={() => setChartType("bar")} variant={chartType === "bar" ? "default" : "outline"}>
            Bar
          </Button>
          <Button onClick={() => setChartType("line")} variant={chartType === "line" ? "default" : "outline"}>
            Line
          </Button>
          <Button onClick={handleDownload}>Download</Button>
        </div>
        <div className="h-[300px]" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={displaySites} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                <YAxis label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${value} µg/m³`, "PM2.5"]}
                  labelFormatter={(label) => `Site: ${label}`}
                />
                <Bar dataKey="pm25" name="PM2.5 Level" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {displaySites.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={AQI_COLORS[entry.category] || "#CCCCCC"} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={displaySites} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                <YAxis label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 12 }} />
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
                  dot={{ r: 4 }}
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

// AQI Category Distribution Pie Chart
export function AQICategoryChart({ sites }: { sites: SiteData[] }) {
  const chartRef = useRef<HTMLDivElement>(null)

  // Count sites by AQI category
  const categoryCount: Record<string, number> = {}
  sites.forEach((site) => {
    const category = site.aqi_category || "Unknown"
    categoryCount[category] = (categoryCount[category] || 0) + 1
  })

  // Convert to chart data
  const chartData = Object.entries(categoryCount).map(([name, value]) => ({
    name,
    value,
  }))

  const handleDownload = () => {
    if (chartRef.current) {
      html2canvas(chartRef.current).then((canvas) => {
        const link = document.createElement("a")
        link.download = "aqi-category-chart.png"
        link.href = canvas.toDataURL("image/png")
        link.click()
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AQI Category Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button onClick={handleDownload}>Download</Button>
        </div>
        <div className="h-[300px]" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={AQI_COLORS[entry.name] || "#CCCCCC"} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} sites`, "Count"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Weekly Comparison Line/Bar Chart
export function WeeklyComparisonChart({ sites }: { sites: SiteData[] }) {
  const [chartType, setChartType] = useState<"bar" | "line">("line")
  const chartRef = useRef<HTMLDivElement>(null)

  // Filter sites with weekly data
  const sitesWithData = sites
    .filter(
      (site) =>
        site.averages?.weeklyAverages?.currentWeek !== undefined &&
        site.averages?.weeklyAverages?.previousWeek !== undefined,
    )
    .slice(0, 7) // Limit to 7 sites for readability

  const chartData = sitesWithData.map((site) => ({
    name: site.siteDetails?.name || "Unknown",
    current: site.averages?.weeklyAverages?.currentWeek || 0,
    previous: site.averages?.weeklyAverages?.previousWeek || 0,
    change: site.averages?.percentageDifference || 0,
  }))

  const handleDownload = () => {
    if (chartRef.current) {
      html2canvas(chartRef.current).then((canvas) => {
        const link = document.createElement("a")
        link.download = `weekly-comparison-${chartType}-chart.png`
        link.href = canvas.toDataURL("image/png")
        link.click()
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Weekly PM2.5 Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4 space-x-2">
          <Button onClick={() => setChartType("bar")} variant={chartType === "bar" ? "default" : "outline"}>
            Bar
          </Button>
          <Button onClick={() => setChartType("line")} variant={chartType === "line" ? "default" : "outline"}>
            Line
          </Button>
          <Button onClick={handleDownload}>Download</Button>
        </div>
        <div className="h-[300px]" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                <YAxis label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [`${value} µg/m³`, ""]} labelFormatter={(label) => `Site: ${label}`} />
                <Legend />
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
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                <YAxis label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [`${value} µg/m³`, ""]} labelFormatter={(label) => `Site: ${label}`} />
                <Legend />
                <Bar dataKey="current" name="Current Week" fill="#0000FF" />
                <Bar dataKey="previous" name="Previous Week" fill="#000000" />
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

  const handleDownload = () => {
    if (chartRef.current) {
      html2canvas(chartRef.current).then((canvas) => {
        const link = document.createElement("a")
        link.download = "aqi-index-visual.png"
        link.href = canvas.toDataURL("image/png")
        link.click()
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Air Quality Index</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button onClick={handleDownload}>Download</Button>
        </div>
        <div ref={chartRef}>
          <div className="flex flex-col items-center">
            <div className="w-full h-8 bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 via-red-400 via-purple-400 to-red-800 rounded-lg mb-2 relative">
              <div
                className="absolute top-full w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-800"
                style={{ left: `${getIndexPosition(pm25Value)}%`, transform: "translateX(-50%)" }}
              ></div>
            </div>

            <div className="w-full flex justify-between text-xs text-gray-600 mb-4">
              <span>Good</span>
              <span>Moderate</span>
              <span>USG</span>
              <span>Unhealthy</span>
              <span>Very Unhealthy</span>
              <span>Hazardous</span>
            </div>

            <div className="flex items-center justify-center gap-4 mt-2">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: getColorByCategory(aqiCategory) }}
              >
                {pm25Value.toFixed(0)}
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{aqiCategory}</p>
                <p className="text-sm text-gray-600">{pm25Value.toFixed(1)} µg/m³</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}