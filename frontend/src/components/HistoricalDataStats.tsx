"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts"
import { format, parseISO } from "date-fns"
import type { BigQueryMeasurement } from "@/services/bigQueryService"

interface HistoricalDataStatsProps {
  data: BigQueryMeasurement[]
  siteName?: string
}

export function HistoricalDataStats({ data, siteName }: HistoricalDataStatsProps) {
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("line")
  const [metric, setMetric] = useState<"pm2_5" | "pm10" | "both">("both")

  // Calculate statistics
  const stats = {
    pm2_5: {
      avg: data.length > 0 ? data.reduce((sum, item) => sum + item.pm2_5, 0) / data.length : 0,
      max: data.length > 0 ? Math.max(...data.map((item) => item.pm2_5)) : 0,
      min: data.length > 0 ? Math.min(...data.map((item) => item.pm2_5)) : 0,
    },
    pm10: {
      avg: data.length > 0 ? data.reduce((sum, item) => sum + item.pm10, 0) / data.length : 0,
      max: data.length > 0 ? Math.max(...data.map((item) => item.pm10)) : 0,
      min: data.length > 0 ? Math.min(...data.map((item) => item.pm10)) : 0,
    },
  }

  // Format data for display
  const formattedData = data
    .map((item) => {
      // Parse the timestamp in format "YYYY-MM-DD HH:MM:SS UTC" or ISO format
      let date
      try {
        if (typeof item.timestamp === "string") {
          // Check if timestamp is in the "YYYY-MM-DD HH:MM:SS UTC" format
          if (item.timestamp.includes("UTC")) {
            // Extract the date part without UTC and parse it
            const datePart = item.timestamp.replace(" UTC", "")
            date = new Date(datePart)
          } else {
            // Handle ISO format
            date = parseISO(item.timestamp)
          }

          // If date is invalid, try a direct Date constructor
          if (isNaN(date.getTime())) {
            date = new Date(item.timestamp)
          }
        } else {
          date = new Date() // Fallback to current date
        }
      } catch (error) {
        console.error("Error parsing timestamp:", item.timestamp, error)
        date = new Date() // Fallback to current date
      }

      return {
        date: format(date, "MMM dd, yyyy HH:mm"),
        pm2_5: item.pm2_5,
        pm10: item.pm10,
        timestamp: item.timestamp,
      }
    })
    .sort((a, b) => {
      // Handle different timestamp formats for sorting
      let dateA, dateB

      try {
        dateA =
          typeof a.timestamp === "string" && a.timestamp.includes("UTC")
            ? new Date(a.timestamp.replace(" UTC", ""))
            : new Date(a.timestamp)
      } catch (error) {
        dateA = new Date(0) // Default to epoch start if parsing fails
      }

      try {
        dateB =
          typeof b.timestamp === "string" && b.timestamp.includes("UTC")
            ? new Date(b.timestamp.replace(" UTC", ""))
            : new Date(b.timestamp)
      } catch (error) {
        dateB = new Date(0) // Default to epoch start if parsing fails
      }

      return dateA.getTime() - dateB.getTime()
    })

  // Format tooltip
  const formatTooltip = (value: number, name: string) => {
    if (name === "pm2_5") return [`${value} µg/m³`, "PM2.5"]
    if (name === "pm10") return [`${value} µg/m³`, "PM10"]
    return [value, name]
  }

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={70} minTickGap={10} />
            <YAxis label={{ value: "Concentration (µg/m³)", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={formatTooltip} labelFormatter={(label) => `Date: ${label}`} />
            <Legend />
            {(metric === "pm2_5" || metric === "both") && (
              <Line
                type="monotone"
                dataKey="pm2_5"
                name="PM2.5"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            )}
            {(metric === "pm10" || metric === "both") && (
              <Line type="monotone" dataKey="pm10" name="PM10" stroke="#82ca9d" activeDot={{ r: 8 }} strokeWidth={2} />
            )}
          </LineChart>
        )

      case "area":
        return (
          <AreaChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={70} minTickGap={10} />
            <YAxis label={{ value: "Concentration (µg/m³)", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={formatTooltip} labelFormatter={(label) => `Date: ${label}`} />
            <Legend />
            {(metric === "pm2_5" || metric === "both") && (
              <Area
                type="monotone"
                dataKey="pm2_5"
                name="PM2.5"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            )}
            {(metric === "pm10" || metric === "both") && (
              <Area
                type="monotone"
                dataKey="pm10"
                name="PM10"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            )}
          </AreaChart>
        )

      case "bar":
        return (
          <BarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={70} minTickGap={10} />
            <YAxis label={{ value: "Concentration (µg/m³)", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={formatTooltip} labelFormatter={(label) => `Date: ${label}`} />
            <Legend />
            {(metric === "pm2_5" || metric === "both") && <Bar dataKey="pm2_5" name="PM2.5" fill="#8884d8" />}
            {(metric === "pm10" || metric === "both") && <Bar dataKey="pm10" name="PM10" fill="#82ca9d" />}
          </BarChart>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Average Concentrations</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">PM2.5: {stats.pm2_5.avg.toFixed(1)} µg/m³</div>
            <div className="text-2xl font-bold mt-2">PM10: {stats.pm10.avg.toFixed(1)} µg/m³</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Maximum Values</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">PM2.5: {stats.pm2_5.max.toFixed(1)} µg/m³</div>
            <div className="text-2xl font-bold mt-2">PM10: {stats.pm10.max.toFixed(1)} µg/m³</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Minimum Values</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">PM2.5: {stats.pm2_5.min.toFixed(1)} µg/m³</div>
            <div className="text-2xl font-bold mt-2">PM10: {stats.pm10.min.toFixed(1)} µg/m³</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Historical Data Visualization
            {siteName && <span className="ml-2 text-sm font-normal text-gray-500">({siteName})</span>}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Tabs
              defaultValue="both"
              value={metric}
              onValueChange={(value) => setMetric(value as "pm2_5" | "pm10" | "both")}
            >
              <TabsList>
                <TabsTrigger value="both">Both</TabsTrigger>
                <TabsTrigger value="pm2_5">PM2.5</TabsTrigger>
                <TabsTrigger value="pm10">PM10</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs
              defaultValue="line"
              value={chartType}
              onValueChange={(value) => setChartType(value as "line" | "area" | "bar")}
            >
              <TabsList>
                <TabsTrigger value="line">Line</TabsTrigger>
                <TabsTrigger value="area">Area</TabsTrigger>
                <TabsTrigger value="bar">Bar</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

