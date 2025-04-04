"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "recharts"
import { format, parseISO } from "date-fns"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BigQueryMeasurement } from "@/services/bigQueryService"

interface HistoricalDataChartProps {
  data: BigQueryMeasurement[]
  title?: string
  siteName?: string
}

type AggregationPeriod = "hourly" | "daily" | "weekly"
type ChartType = "line" | "area"

export function HistoricalDataChart({ data, title = "Historical Data", siteName }: HistoricalDataChartProps) {
  const [aggregationPeriod, setAggregationPeriod] = useState<AggregationPeriod>("daily")
  const [chartType, setChartType] = useState<ChartType>("line")

  // Aggregate data based on selected period
  const aggregatedData = useMemo(() => {
    if (!data || data.length === 0) return []

    const aggregateMap = new Map<string, { pm2_5: number[]; pm10: number[]; count: number; timestamp: string }>()

    data.forEach((item) => {
      // Parse the timestamp in format "YYYY-MM-DD HH:MM:SS UTC"
      let date
      if (typeof item.timestamp === "string") {
        try {
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
        } catch (error) {
          console.error("Error parsing timestamp:", item.timestamp, error)
          date = new Date() // Fallback to current date
        }
      } else {
        date = new Date() // Fallback to current date
      }

      let key: string

      if (aggregationPeriod === "hourly") {
        key = format(date, "yyyy-MM-dd HH:00")
      } else if (aggregationPeriod === "daily") {
        key = format(date, "yyyy-MM-dd")
      } else {
        // Weekly - use the week number
        key = `${format(date, "yyyy")}-W${format(date, "w")}`
      }

      if (!aggregateMap.has(key)) {
        aggregateMap.set(key, {
          pm2_5: [],
          pm10: [],
          count: 0,
          timestamp: item.timestamp,
        })
      }

      const entry = aggregateMap.get(key)!
      if (typeof item.pm2_5 === "number" && !isNaN(item.pm2_5)) {
        entry.pm2_5.push(item.pm2_5)
      }
      if (typeof item.pm10 === "number" && !isNaN(item.pm10)) {
        entry.pm10.push(item.pm10)
      }
      entry.count++
    })

    // Calculate averages and format for chart
    return Array.from(aggregateMap.entries())
      .map(([key, value]) => {
        const avgPM25 = value.pm2_5.length > 0 ? value.pm2_5.reduce((sum, val) => sum + val, 0) / value.pm2_5.length : 0
        const avgPM10 = value.pm10.length > 0 ? value.pm10.reduce((sum, val) => sum + val, 0) / value.pm10.length : 0

        let displayDate: string

        // Parse the timestamp in format "YYYY-MM-DD HH:MM:SS UTC"
        let date
        if (typeof value.timestamp === "string") {
          try {
            // Check if timestamp is in the "YYYY-MM-DD HH:MM:SS UTC" format
            if (value.timestamp.includes("UTC")) {
              // Extract the date part without UTC and parse it
              const datePart = value.timestamp.replace(" UTC", "")
              date = new Date(datePart)
            } else {
              // Handle ISO format
              date = parseISO(value.timestamp)
            }

            // If date is invalid, try a direct Date constructor
            if (isNaN(date.getTime())) {
              date = new Date(value.timestamp)
            }
          } catch (error) {
            console.error("Error parsing timestamp:", value.timestamp, error)
            date = new Date() // Fallback to current date
          }
        } else {
          date = new Date() // Fallback to current date
        }

        if (aggregationPeriod === "hourly") {
          displayDate = format(date, "MMM dd, HH:00")
        } else if (aggregationPeriod === "daily") {
          displayDate = format(date, "MMM dd")
        } else {
          // Weekly
          displayDate = `Week ${format(date, "w")}, ${format(date, "yyyy")}`
        }

        return {
          name: key,
          displayDate,
          pm2_5: Number.parseFloat(avgPM25.toFixed(1)),
          pm10: Number.parseFloat(avgPM10.toFixed(1)),
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data, aggregationPeriod])

  // Format tooltip
  const formatTooltip = (value: number, name: string) => {
    if (name === "pm2_5") return [`${value} µg/m³`, "PM2.5"]
    if (name === "pm10") return [`${value} µg/m³`, "PM10"]
    return [value, name]
  }

  // Render appropriate chart based on type
  const renderChart = () => {
    if (chartType === "line") {
      return (
        <LineChart data={aggregatedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={70}
            minTickGap={10}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: "PM10 (µg/m³)", angle: 90, position: "insideRight" }}
          />
          <Tooltip formatter={formatTooltip} labelFormatter={(label) => `Date: ${label}`} />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="pm2_5"
            name="PM2.5"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="pm10"
            name="PM10"
            stroke="#82ca9d"
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
        </LineChart>
      )
    } else {
      return (
        <AreaChart data={aggregatedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={70}
            minTickGap={10}
          />
          <YAxis label={{ value: "Concentration (µg/m³)", angle: -90, position: "insideLeft" }} />
          <Tooltip formatter={formatTooltip} labelFormatter={(label) => `Date: ${label}`} />
          <Legend />
          <Area
            type="monotone"
            dataKey="pm2_5"
            name="PM2.5"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="pm10"
            name="PM10"
            stroke="#82ca9d"
            fill="#82ca9d"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      )
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {title}
          {siteName && <span className="ml-2 text-sm font-normal text-gray-500">({siteName})</span>}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Select value={aggregationPeriod} onValueChange={(value) => setAggregationPeriod(value as AggregationPeriod)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Aggregation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
          <Tabs defaultValue="line" value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
            <TabsList>
              <TabsTrigger value="line">Line</TabsTrigger>
              <TabsTrigger value="area">Area</TabsTrigger>
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
  )
}

