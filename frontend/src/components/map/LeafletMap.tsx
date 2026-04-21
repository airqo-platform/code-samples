"use client"

import "leaflet/dist/leaflet.css"
import type React from "react"
import { useEffect, useRef, useState, useMemo } from "react"
import ReactDOM from "react-dom/client"
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet"
import Image from "next/image"
import L from "leaflet"
import { GeoSearchControl } from "leaflet-geosearch"
import "leaflet-geosearch/dist/geosearch.css" 
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Droplets,
  LoaderCircle,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react"

// Use direct URLs for Leaflet marker icons
const markerIconUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png"
const markerShadowUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
import {
  getSatelliteData,
  getMapNodes,
  getHeatmapData,
  getDailyForecastCollection,
  getSiteHistorical,
  type DailyForecastResponse,
} from "@/services/apiService"
import { MapLayerControl } from "./MapLayerControl"

// Create a custom MapboxProvider class since the import might not work directly
class MapboxProvider {
  constructor(options: { params: { access_token: string } }) {
    this.accessToken = options.params.access_token
  }

  private accessToken: string

  async search({ query }: { query: string }) {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query,
        )}.json?access_token=${this.accessToken}&limit=5`,
      )
      const data = await response.json()

      return data.features.map((feature: any) => ({
        x: feature.center[0], // longitude
        y: feature.center[1], // latitude
        label: feature.place_name,
        bounds: feature.bbox
          ? [
              [feature.bbox[1], feature.bbox[0]], // southwest
              [feature.bbox[3], feature.bbox[2]], // northeast
            ]
          : undefined,
        raw: feature,
      }))
    } catch (error) {
      console.error("Mapbox geocoding error:", error)
      return []
    }
  }
}

// Import air quality images from public directory
const GoodAir = "/images/GoodAir.png"
const Moderate = "/images/Moderate.png"
const UnhealthySG = "/images/UnhealthySG.png"
const Unhealthy = "/images/Unhealthy.png"
const VeryUnhealthy = "/images/VeryUnhealthy.png"
const Hazardous = "/images/Hazardous.png"
const Invalid = "/images/Invalid.png"

const getAqiImageByCategory = (aqiCategory?: string) => {
  switch ((aqiCategory || "").toLowerCase()) {
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

// Set default icon for markers
const DefaultIcon = L.icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

// Update the interface to match the actual API response
interface SatelliteData {
  latitude: number
  longitude: number
  pm2_5_prediction: number
  timestamp: string
}

// Add type guard for API response
const isSatelliteData = (data: any): data is SatelliteData => {
  return (
    data &&
    typeof data.latitude === "number" &&
    typeof data.longitude === "number" &&
    typeof data.pm2_5_prediction === "number" &&
    typeof data.timestamp === "string"
  )
}

// Update the air quality info function to handle invalid values
const getAirQualityInfo = (pm25: number | null) => {
  // Handle invalid or null PM2.5 values
  if (pm25 === null || isNaN(pm25)) {
    return {
      level: "Invalid Data",
      image: Invalid,
      color: "bg-white border-gray-200",
    }
  }

  if (pm25 <= 9)
    return {
      level: "Good",
      image: GoodAir,
      color: "bg-white border-green-200",
    }
  if (pm25 <= 35.4)
    return {
      level: "Moderate",
      image: Moderate,
      color: "bg-white border-yellow-200",
    }
  if (pm25 <= 55.4)
    return {
      level: "Unhealthy for Sensitive Groups",
      image: UnhealthySG,
      color: "bg-white border-orange-200",
    }
  if (pm25 <= 125.4)
    return {
      level: "Unhealthy",
      image: Unhealthy,
      color: "bg-white border-red-200",
    }
  if (pm25 <= 225.4)
    return {
      level: "Very Unhealthy",
      image: VeryUnhealthy,
      color: "bg-white border-purple-200",
    }
  return {
    level: "Hazardous",
    image: Hazardous,
    color: "bg-white border-red-300",
  }
}

// Create a component for the popup content
const PopupContent: React.FC<{
  label: string
  data: Partial<SatelliteData>
  onClose: () => void
}> = ({ label, data, onClose }) => {
  const { level, image, color } = getAirQualityInfo(data.pm2_5_prediction ?? null)

  // Safely format timestamp
  const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString() : "Unknown"

  return (
    <div className={`min-w-[200px] p-3 rounded-lg ${color} border`}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-12 h-12 relative">
          <Image
            src={image || "/placeholder.svg"}
            alt={level}
            width={48}
            height={48}
            className="w-full h-full"
            quality={100}
            priority
          />
        </div>
        <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
          x
        </button>
      </div>
      <div className="text-sm font-medium mb-2">{label}</div>
      <div className="text-lg font-semibold mb-1">{level}</div>
      <div className="text-sm text-gray-700">PM2.5: {data.pm2_5_prediction?.toFixed(1) ?? "N/A"} ug/m3</div>
      <div className="text-xs text-gray-500 mt-2">Updated {timestamp}</div>
    </div>
  )
}

// Create a loading popup component
const LoadingPopupContent: React.FC<{
  label: string
  onClose: () => void
}> = ({ label, onClose }) => (
  <div className="min-w-[200px] p-3 rounded-lg bg-white border">
    <div className="flex items-center justify-between mb-2">
      <div className="w-8 h-8">
        <div className="animate-pulse bg-gray-200 h-full w-full rounded-full" />
      </div>
      <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
        x
      </button>
    </div>
    <div className="text-sm font-medium mb-2">{label}</div>
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
)

// Create an error popup component
const ErrorPopupContent: React.FC<{
  label: string
  onClose: () => void
  errorMessage?: string
}> = ({ label, onClose, errorMessage = "Error loading air quality data" }) => (
  <div className="min-w-[200px] p-3 rounded-lg bg-gray-100 border border-gray-200">
    <div className="flex items-center justify-between mb-2">
      <div className="w-12 h-12 relative">
        <Image
          src={Invalid || "/placeholder.svg"}
          alt="Error"
          width={48}
          height={48}
          className="w-full h-full"
          quality={100}
          priority
        />
      </div>
      <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
        x
      </button>
    </div>
    <div className="text-sm font-medium mb-2">{label}</div>
    <div className="text-sm text-gray-700">{errorMessage}</div>
  </div>
)

// Add this CSS class to override default Leaflet popup styles
const customPopupOptions = {
  className: "custom-popup",
  closeButton: false,
  maxWidth: 300,
  minWidth: 200,
  offset: [0, -20],
  autoPan: true,
}

// Component to add the search control to the map
const SearchControl: React.FC<{
  defaultCenter: [number, number]
  defaultZoom: number
}> = ({ defaultCenter, defaultZoom }) => {
  const map = useMap()
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    const provider = new MapboxProvider({
      params: {
        access_token: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "",
      },
    })

    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      position: "topright",
    })

    map.addControl(searchControl)

    // Apply custom TailwindCSS styles to the search bar and add search icon
    const searchBar = document.querySelector(".leaflet-control-geosearch form")
    if (searchBar) {
      searchBar.classList.add("bg-white", "text-black", "border", "border-gray-400", "rounded-md", "relative")

      // Adjust the width and positioning
      const searchContainer = document.querySelector(".leaflet-control-geosearch")
      if (searchContainer) {
        // Position the search bar on the right side
        searchContainer.classList.add("!right-4", "!top-4", "!left-auto", "!transform-none", "!w-64")
      }

      // Create and add the search icon
      const searchIcon = document.createElement("div")
      searchIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      `
      searchIcon.className = "absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
      searchBar.appendChild(searchIcon)

      // Adjust the search input padding to accommodate the icon
      const searchInput = searchBar.querySelector("input")
      if (searchInput) {
        searchInput.style.paddingLeft = "2.5rem"
        // Add some additional styling to the input
        searchInput.classList.add(
          "w-full",
          "pl-10",
          "pr-4",
          "py-2",
          "rounded-md",
          "focus:outline-none",
          "focus:border-transparent",
        )
      }
    }

    const searchResults = document.querySelector(".leaflet-control-geosearch .results")
    if (searchResults) {
      searchResults.classList.add("bg-white", "text-black")
    }

    // Event listener to clear markers and reset the map when search is cleared
    map.on("geosearch/marker/clear", () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.setView(defaultCenter, defaultZoom)
    })

    // Event listener for when a location is found
    map.on("geosearch/showlocation", async (result: any) => {
      try {
        const { x, y, label } = result.location

        if (typeof x !== "number" || typeof y !== "number" || !label) {
          throw new Error("Invalid location data")
        }

        // Center the map on the selected location with animation
        map.setView([y, x], 13, {
          animate: true,
          duration: 1,
        })

        markersRef.current.forEach((marker) => marker.remove())
        markersRef.current = []

        const marker = L.marker([y, x], { icon: DefaultIcon }).addTo(map)
        markersRef.current.push(marker)

        // Create a container div for the popup
        const container = document.createElement("div")

        // Render loading state
        const root = ReactDOM.createRoot(container)
        root.render(
          <LoadingPopupContent
            label={label}
            onClose={() => {
              marker.closePopup()
              root.unmount()
            }}
          />,
        )

        marker.bindPopup(container, { ...customPopupOptions, offset: [0, 0] }).openPopup()

        try {
          const response = await getSatelliteData({
            latitude: y,
            longitude: x,
          })

          // Validate API response
          if (!response || !isSatelliteData(response)) {
            throw new Error("Invalid API response format")
          }

          // Update with actual data
          root.render(<PopupContent label={label} data={response} onClose={() => marker.closePopup()} />)
        } catch (error) {
          console.error("Error fetching air quality data:", error)
          // Show error state with specific error message
          root.render(
            <ErrorPopupContent
              label={label}
              onClose={() => marker.closePopup()}
              errorMessage={error instanceof Error ? error.message : "Failed to load air quality data"}
            />,
          )
        }
      } catch (error) {
        console.error("Error handling location:", error)
        // Handle location processing errors
        const errorContainer = document.createElement("div")
        const errorRoot = ReactDOM.createRoot(errorContainer)
        errorRoot.render(
          <ErrorPopupContent label="Location Error" onClose={() => {}} errorMessage="Invalid location data received" />,
        )
      }
    })

    // Event listener for search input cancel or clear
    const searchInput = document.querySelector(".leaflet-control-geosearch input")
    if (searchInput) {
      searchInput.addEventListener("input", (event: any) => {
        if (!event.target.value) {
          map.setView(defaultCenter, defaultZoom)
          markersRef.current.forEach((marker) => marker.remove())
          markersRef.current = []
        }
      })
    }

    return () => {
      map.removeControl(searchControl)
    }
  }, [map, defaultCenter, defaultZoom])

  return null
}

// Add interface for map nodes
interface MapNode {
  _id: string
  site_id: string
  time: string
  aqi_category: string
  aqi_color: string
  pm2_5: { value: number | null }
  averages?: {
    percentageDifference?: number
    weeklyAverages?: {
      currentWeek?: number
      previousWeek?: number
    }
  }
  siteDetails: {
    location_name?: string
    name?: string
    approximate_latitude: number
    approximate_longitude: number
    formatted_name?: string
  }
}

// Add loading state interface
interface LoadingState {
  isLoading: boolean
  error: string | null
}

interface DailyForecastItem {
  time: string
  pm2_5: number | null
  pm2_5_low?: number | null
  pm2_5_high?: number | null
  pm2_5_max?: number | null
  forecast_confidence?: number | null
  air_temperature?: number | null
  relative_humidity?: number | null
  precipitation_amount?: number | null
  wind_speed?: number | null
  wind_direction_compass?: string
  aqi_category?: string
  aqi_color?: string
  aqi_color_name?: string
  created_at?: string
}

interface ForecastState {
  isLoading: boolean
  error: string | null
  collection: DailyForecastResponse | null
}

type HistoricalPoint = { date: Date; pm25: number }

type HistoricalSeriesPoint = { x: Date; pm25: number }
type HistoricalSeriesMode = "daily" | "hourly"

const extractHistoricalTime = (row: any): string | null => {
  if (!row) return null
  const t = row.time || row.timestamp || row.datetime
  return typeof t === "string" ? t : null
}

const extractHistoricalPm25 = (row: any): number | null => {
  if (!row) return null
  const pm = row.pm2_5
  if (typeof pm === "number") return Number.isFinite(pm) ? pm : null
  if (pm && typeof pm === "object" && typeof pm.value === "number") return Number.isFinite(pm.value) ? pm.value : null
  if (typeof row.pm2_5_calibrated_value === "number") return Number.isFinite(row.pm2_5_calibrated_value) ? row.pm2_5_calibrated_value : null
  if (typeof row.pm2_5_raw_value === "number") return Number.isFinite(row.pm2_5_raw_value) ? row.pm2_5_raw_value : null
  return null
}

const buildHourlySeries = (rows: any[]): HistoricalSeriesPoint[] => {
  const points: HistoricalSeriesPoint[] = []
  rows.forEach((row) => {
    const time = extractHistoricalTime(row)
    const pm25 = extractHistoricalPm25(row)
    if (!time || typeof pm25 !== "number") return
    const dt = new Date(time)
    if (Number.isNaN(dt.getTime())) return
    points.push({ x: dt, pm25 })
  })
  points.sort((a, b) => a.x.getTime() - b.x.getTime())
  return points
}

const toIsoUtc = (d: Date) => {
  const dt = new Date(d)
  return dt.toISOString()
}

const getLastNDaysRangeIso = (days: number) => {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return { startIso: toIsoUtc(start), endIso: toIsoUtc(end) }
}

const buildLast7DaysDailyAverage = (rows: any[]): HistoricalPoint[] => {
  const byDay = new Map<string, { date: Date; sum: number; count: number }>()

  rows.forEach((row) => {
    const time = extractHistoricalTime(row)
    const pm25 = extractHistoricalPm25(row)
    if (!time || typeof pm25 !== "number") return

    const dt = new Date(time)
    if (Number.isNaN(dt.getTime())) return

    const key = dt.toISOString().slice(0, 10) // yyyy-mm-dd (UTC)
    const bucket = byDay.get(key) || { date: new Date(key), sum: 0, count: 0 }
    bucket.sum += pm25
    bucket.count += 1
    byDay.set(key, bucket)
  })

  return Array.from(byDay.values())
    .map((b) => ({ date: b.date, pm25: b.count ? b.sum / b.count : 0 }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

const uniqueDayCount = (rows: any[]): number => {
  const set = new Set<string>()
  rows.forEach((row) => {
    const time = extractHistoricalTime(row)
    if (!time) return
    const dt = new Date(time)
    if (Number.isNaN(dt.getTime())) return
    set.add(dt.toISOString().slice(0, 10))
  })
  return set.size
}

// Create a loading indicator component
const LoadingIndicator: React.FC<LoadingState> = ({ isLoading, error }) => {
  if (!isLoading && !error) return null

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-md p-3">
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
          <span className="text-sm text-gray-600">Loading map data...</span>
        </div>
      ) : error ? (
        <div className="flex items-center space-x-2 text-red-500">
          <span className="text-sm">{error}</span>
        </div>
      ) : null}
    </div>
  )
}

const parseForecastTime = (time: string) => {
  const raw = time || ""
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00` : raw.includes(" ") ? raw.replace(" ", "T") : raw
  const dt = new Date(normalized)
  return Number.isNaN(dt.getTime()) ? null : dt
}

const formatForecastMetric = (value: number | null | undefined, digits = 1, suffix = "") =>
  typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : "N/A"

const formatForecastMetricWithUnit = (
  value: number | null | undefined,
  digits = 1,
  unit = "",
) => {
  const formatted = formatForecastMetric(value, digits)
  return formatted === "N/A" || !unit ? formatted : `${formatted} ${unit}`
}

const hasForecastMetricValue = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value)

const normalizeHexColor = (value?: string | null, fallback = "#E4B84A") => {
  const raw = typeof value === "string" ? value.trim() : ""
  if (!raw) return fallback
  return raw.startsWith("#") ? raw : `#${raw}`
}

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = normalizeHexColor(hex).replace("#", "")
  const value = normalized.length === 3 ? normalized.split("").map((char) => `${char}${char}`).join("") : normalized

  if (value.length !== 6) return `rgba(228, 184, 74, ${alpha})`

  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const clampNumber = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const getAqiBadgeStyle = (category?: string | null, fallbackColor = "#E4B84A") => {
  const normalized = (category || "").toLowerCase()
  const styles: Record<string, { borderColor: string; backgroundColor: string; color: string; dotColor: string }> = {
    good: {
      borderColor: "#BBF7D0",
      backgroundColor: "#F0FDF4",
      color: "#166534",
      dotColor: "#22C55E",
    },
    moderate: {
      borderColor: "#FDE68A",
      backgroundColor: "#FFFBEB",
      color: "#92400E",
      dotColor: "#F59E0B",
    },
    "unhealthy for sensitive groups": {
      borderColor: "#FED7AA",
      backgroundColor: "#FFF7ED",
      color: "#9A3412",
      dotColor: "#F97316",
    },
    unhealthy: {
      borderColor: "#FECACA",
      backgroundColor: "#FEF2F2",
      color: "#991B1B",
      dotColor: "#EF4444",
    },
    "very unhealthy": {
      borderColor: "#E9D5FF",
      backgroundColor: "#FAF5FF",
      color: "#6B21A8",
      dotColor: "#A855F7",
    },
    hazardous: {
      borderColor: "#FBCFE8",
      backgroundColor: "#FDF2F8",
      color: "#9D174D",
      dotColor: "#DB2777",
    },
  }

  return (
    styles[normalized] || {
      borderColor: hexToRgba(fallbackColor, 0.28),
      backgroundColor: hexToRgba(fallbackColor, 0.1),
      color: "#334155",
      dotColor: fallbackColor,
    }
  )
}

const ForecastStatusBadge: React.FC<{ forecastState: ForecastState }> = ({ forecastState }) => {
  if (!forecastState.isLoading && !forecastState.error) return null

  return (
    <div className="absolute left-4 top-4 z-[1000] max-w-[260px] rounded-md border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      {forecastState.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
          <span>Loading forecast coverage...</span>
        </div>
      ) : forecastState.error ? (
        <div className="text-sm text-rose-700">{forecastState.error}</div>
      ) : null}
    </div>
  )
}

const ForecastDayPill: React.FC<{
  item: DailyForecastItem
  isActive: boolean
  onClick: () => void
}> = ({ item, isActive, onClick }) => {
  const dt = parseForecastTime(item.time)
  const weekday = dt ? dt.toLocaleDateString(undefined, { weekday: "short" }) : (item.time || "?").slice(0, 3)
  const dayMark = weekday.charAt(0).toUpperCase()
  const dayNum = dt ? String(dt.getDate()) : "--"
  const imageSrc = getAqiImageByCategory(item.aqi_category)
  const accentColor = normalizeHexColor(item.aqi_color)

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-[104px] w-[56px] shrink-0 items-center justify-center rounded-[28px] border text-center shadow-sm transition-all duration-200",
        isActive
          ? "border-transparent bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)]"
          : "bg-white text-slate-700 hover:-translate-y-0.5 hover:shadow-md",
      ].join(" ")}
      style={isActive ? undefined : { borderColor: "#EBCF90" }}
      aria-label={`Forecast for ${weekday} ${dayNum}`}
    >
      <div className="flex h-full flex-col items-center justify-between px-1 py-3">
        <div className={["text-[11px] font-semibold leading-none", isActive ? "text-white/90" : "text-slate-500"].join(" ")}>
          {dayMark}
        </div>
        <div className={["text-[23px] font-semibold leading-none", isActive ? "text-white" : "text-slate-900"].join(" ")}>{dayNum}</div>
        <div className="flex flex-col items-center gap-1">
          <div
            className={[
              "relative flex h-6 w-6 items-center justify-center rounded-full border",
              isActive ? "border-white/30 bg-white/20" : "bg-[#FFF8E7]",
            ].join(" ")}
            style={isActive ? undefined : { borderColor: hexToRgba(accentColor, 0.28) }}
            title={item.aqi_color_name || item.aqi_category || "Unknown"}
          >
            <Image src={imageSrc} alt={item.aqi_category || "Unknown"} fill className="object-contain p-[3px]" />
          </div>
          <div className={["text-[10px] font-semibold leading-none", isActive ? "text-white/80" : "text-slate-400"].join(" ")}>
            {typeof item.pm2_5 === "number" ? item.pm2_5.toFixed(0) : "--"}
          </div>
        </div>
      </div>
    </button>
  )
}

const ForecastPanel: React.FC<{
  selectedNode: MapNode | null
  forecastState: ForecastState
  onClose: () => void
}> = ({ selectedNode, forecastState, onClose }) => {
  const selectedSiteForecast = useMemo(() => {
    const siteId = selectedNode?.site_id
    if (!siteId || !forecastState.collection?.forecasts?.length) return null

    return forecastState.collection.forecasts.find((site) => site.site_details?.site_id === siteId) || null
  }, [forecastState.collection, selectedNode?.site_id])

  const selectedForecasts = useMemo<DailyForecastItem[] | null>(() => {
    if (!selectedSiteForecast?.forecasts?.length) return null

    return selectedSiteForecast.forecasts.map((item) => ({
      time: item.date,
      pm2_5: typeof item.forecast.pm2_5_mean === "number" ? item.forecast.pm2_5_mean : item.aqi.aqi_value,
      pm2_5_low: item.forecast.pm2_5_low,
      pm2_5_high: item.forecast.pm2_5_high,
      pm2_5_max: item.forecast.pm2_5_max,
      forecast_confidence: item.forecast.forecast_confidence,
      air_temperature: item.met.air_temperature,
      relative_humidity: item.met.relative_humidity,
      precipitation_amount: item.met.precipitation_amount,
      wind_speed: item.met.wind_speed,
      wind_direction_compass: item.met.wind_direction_compass,
      aqi_category: item.aqi.aqi_category,
      aqi_color: item.aqi.aqi_color,
      aqi_color_name: item.aqi.aqi_color_name,
      created_at: item.created_at,
    }))
  }, [selectedSiteForecast])

  const title =
    selectedSiteForecast?.site_details?.site_name ||
    selectedNode?.siteDetails?.name ||
    selectedNode?.siteDetails?.formatted_name ||
    selectedNode?.siteDetails?.location_name ||
    "Select a site"

  return (
    <aside className="flex h-full w-[448px] flex-col border-l bg-white/92 backdrop-blur-xl">
      <div className="border-b bg-white/70 backdrop-blur-xl">
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="min-w-0 order-last flex-1">
            <div className="truncate text-lg font-semibold text-gray-900">{title}</div>
            {selectedNode?.site_id ? (
              <div className="truncate text-xs text-gray-500">{selectedNode.site_id}</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="order-first shrink-0 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close forecast panel"
          >
            x
          </button>
        </div>
      </div>

      <div className="flex-1 px-5 py-4">
        {!selectedNode ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-600">
            Click a site on the map to load the next days&apos; forecast.
          </div>
        ) : forecastState.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
            Loading forecast...
          </div>
        ) : forecastState.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {forecastState.error}
          </div>
        ) : !selectedForecasts?.length ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">No forecast data.</div>
        ) : (
          <div className="space-y-3">
            <ForecastContent selectedNode={selectedNode} forecasts={selectedForecasts} />
          </div>
        )}
      </div>

      <style jsx global>{`
        .forecast-strip::-webkit-scrollbar {
          height: 10px;
        }
        .forecast-strip::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 999px;
        }
        .forecast-strip::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 999px;
        }
        .forecast-strip {
          scrollbar-color: #6b7280 #e5e7eb;
          scrollbar-width: thin;
        }
      `}</style>
    </aside>
  )
}

function ForecastContent({ selectedNode, forecasts }: { selectedNode: MapNode | null; forecasts: DailyForecastItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [historicalState, setHistoricalState] = useState<{
    isLoading: boolean
    error: string | null
    mode: HistoricalSeriesMode
    points: HistoricalSeriesPoint[] | null
    stats: null | {
      samples: number
      days: number
      avg: number
      min: number
      max: number
      latestTime: Date | null
      latestPm25: number | null
    }
  }>({
    isLoading: false,
    error: null,
    mode: "daily",
    points: null,
    stats: null,
  })

  useEffect(() => {
    setActiveIndex(0)
    setInsightsOpen(false)
    setHistoricalState({ isLoading: false, error: null, mode: "daily", points: null, stats: null })
  }, [selectedNode?.site_id])

  useEffect(() => {
    const siteId = selectedNode?.site_id
    if (!insightsOpen || !siteId) return

    let isActive = true
    setHistoricalState({ isLoading: true, error: null, mode: "daily", points: null, stats: null })

    const { startIso, endIso } = getLastNDaysRangeIso(7)

    getSiteHistorical(siteId, startIso, endIso)
      .then((rows) => {
        if (!isActive) return
        if (!rows?.length) {
          setHistoricalState({ isLoading: false, error: "No historical data returned for this site.", mode: "daily", points: null, stats: null })
          return
        }

        const samples = rows.length
        const days = uniqueDayCount(rows)

        const values = rows
          .map((r) => extractHistoricalPm25(r))
          .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
        const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
        const min = values.length ? Math.min(...values) : 0
        const max = values.length ? Math.max(...values) : 0

        const sortedHourly = buildHourlySeries(rows)
        const latest = sortedHourly.length ? sortedHourly[sortedHourly.length - 1] : null

        const mode: HistoricalSeriesMode = days >= 3 ? "daily" : "hourly"
        const points: HistoricalSeriesPoint[] =
          mode === "daily"
            ? buildLast7DaysDailyAverage(rows).map((p) => ({ x: p.date, pm25: p.pm25 }))
            : sortedHourly

        if (!points.length) {
          setHistoricalState({ isLoading: false, error: "No historical data returned for this site.", mode, points: null, stats: null })
          return
        }

        setHistoricalState({
          isLoading: false,
          error: null,
          mode,
          points,
          stats: {
            samples,
            days,
            avg,
            min,
            max,
            latestTime: latest?.x ?? null,
            latestPm25: latest?.pm25 ?? null,
          },
        })
      })
      .catch((error) => {
        if (!isActive) return
        console.error(error)
        setHistoricalState({ isLoading: false, error: "Failed to load historical data.", mode: "daily", points: null, stats: null })
      })

    return () => {
      isActive = false
    }
  }, [insightsOpen, selectedNode?.site_id])

  const percentChange = selectedNode?.averages?.percentageDifference

  const percentText =
    typeof percentChange === "number" && Number.isFinite(percentChange)
      ? `${percentChange > 0 ? "+" : ""}${percentChange.toFixed(1)}%`
      : "N/A"
  const percentClass =
    typeof percentChange === "number" && Number.isFinite(percentChange)
      ? percentChange > 0
        ? "text-red-600"
        : percentChange < 0
          ? "text-green-600"
          : "text-gray-600"
      : "text-gray-600"

  const active = forecasts[activeIndex] || forecasts[0]
  const dt = active ? parseForecastTime(active.time) : null
  const activeLabel = dt ? dt.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) : ""
  const activeAccentColor = normalizeHexColor(active?.aqi_color)
  const activeBadgeStyle = getAqiBadgeStyle(active?.aqi_category, activeAccentColor)
  const createdAt = active?.created_at ? parseForecastTime(active.created_at) : null
  const rangeLow = typeof active?.pm2_5_low === "number" && Number.isFinite(active.pm2_5_low) ? active.pm2_5_low : null
  const rangeHigh = typeof active?.pm2_5_high === "number" && Number.isFinite(active.pm2_5_high) ? active.pm2_5_high : null
  const rangeMaxValue = Math.max(
    typeof active?.pm2_5_max === "number" && Number.isFinite(active.pm2_5_max) ? active.pm2_5_max : 0,
    typeof active?.pm2_5 === "number" && Number.isFinite(active.pm2_5) ? active.pm2_5 : 0,
    rangeHigh ?? 0,
    10,
  )
  const lowPosition = rangeLow === null ? 0 : clampNumber((rangeLow / rangeMaxValue) * 100, 0, 100)
  const highPosition = rangeHigh === null ? lowPosition : clampNumber((rangeHigh / rangeMaxValue) * 100, 0, 100)
  const rangeStart = Math.min(lowPosition, highPosition)
  const rangeWidth = Math.max(Math.abs(highPosition - lowPosition), 6)
  const meanPosition =
    typeof active?.pm2_5 === "number" && Number.isFinite(active.pm2_5)
      ? clampNumber((active.pm2_5 / rangeMaxValue) * 100, 0, 100)
      : null
  const metricCards: Array<{ label: string; value: string; Icon: LucideIcon; span?: string }> = []

  if (hasForecastMetricValue(active?.air_temperature)) {
    metricCards.push({
      label: "Temperature",
      value: formatForecastMetricWithUnit(active?.air_temperature, 1, "degC"),
      Icon: Thermometer,
    })
  }

  if (hasForecastMetricValue(active?.precipitation_amount)) {
    metricCards.push({
      label: "Rain",
      value: formatForecastMetricWithUnit(active?.precipitation_amount, 1, "mm"),
      Icon: CloudRain,
    })
  }

  if (hasForecastMetricValue(active?.relative_humidity)) {
    metricCards.push({
      label: "Humidity",
      value: formatForecastMetric(active?.relative_humidity, 0, "%"),
      Icon: Droplets,
    })
  }

  if (hasForecastMetricValue(active?.wind_speed)) {
    metricCards.push({
      label: "Wind",
      Icon: Wind,
      value: `${formatForecastMetric(active?.wind_speed, 1)} m/s${
        active?.wind_direction_compass ? ` ${active.wind_direction_compass}` : ""
      }`,
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">Forecast outlook</div> 
        </div>
        <div className="forecast-strip flex gap-3 overflow-x-auto rounded-[8px] bg-[#F6F7FB] px-2 py-3 pb-4">
          {forecasts.slice(0, 14).map((f, idx) => (
            <ForecastDayPill
              key={`${f.time}-${idx}`}
              item={f}
              isActive={idx === activeIndex}
              onClick={() => setActiveIndex(idx)}
            />
          ))}
        </div>
      </div>

      {active ? (
        <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{activeLabel}</span>
              </div>
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm"
                style={{
                  borderColor: activeBadgeStyle.borderColor,
                  backgroundColor: activeBadgeStyle.backgroundColor,
                  color: activeBadgeStyle.color,
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeBadgeStyle.dotColor }} />
                <span>{active.aqi_category || "Unknown"}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">PM2.5 mean</div>
                <div className="mt-1 text-sm font-semibold text-slate-950">{formatForecastMetric(active.pm2_5, 1)}</div>
                <div className="text-xs font-medium text-slate-500">ug/m3</div>
                <div className="mt-1 text-xs font-semibold text-slate-700">
                  {formatForecastMetric(active.forecast_confidence, 0, "%")}
                  <span className="ml-1 font-medium text-slate-500">confidence</span>
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Forecast range</div>
                <div className="mt-1 text-sm font-semibold text-slate-950">
                  {formatForecastMetric(active.pm2_5_low, 1)} - {formatForecastMetric(active.pm2_5_high, 1)}
                </div>
                <div className="text-xs font-medium text-slate-500">ug/m3</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Peak</div>
                <div className="mt-1 text-sm font-semibold text-slate-950">{formatForecastMetric(active.pm2_5_max, 1)}</div>
                <div className="text-xs font-medium text-slate-500">ug/m3</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Change</div>
                <div className={["mt-1 text-sm font-semibold", percentClass].join(" ")}>{percentText}</div>
                <div className="text-xs font-medium text-slate-500">vs last week</div>
              </div>
            </div>
            {createdAt ? (
              <div className="text-xs text-slate-500">
                Updated {createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at{" "}
                {createdAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {active && metricCards.length ? (
        <div className="rounded-[8px] border border-slate-200 bg-[#F8FAFC] p-4">
          <div className="grid grid-cols-4 gap-2">
            {metricCards.map((metric) => (
              <div
                key={metric.label}
                className="min-w-0 rounded-[8px] border border-slate-200 bg-white px-2 py-2"
                aria-label={`${metric.label}: ${metric.value}`}
                title={metric.label}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] bg-slate-100 text-slate-600">
                    <metric.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="sr-only">{metric.label}</span>
                </div>
                <div className="mt-1 truncate text-xs font-semibold text-slate-950">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-[8px] border border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setInsightsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3"
          aria-expanded={insightsOpen}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <Wind className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-gray-900">PM2.5 Trend</span>
          </div>
          {insightsOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
        </button>

        {insightsOpen ? (
          <div className="border-t px-4 py-4">
            {historicalState.stats ? (
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-[8px] bg-slate-50 px-3 py-2">
                  <div className="text-xs font-medium text-slate-500">7-day avg</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">{historicalState.stats.avg.toFixed(1)} ug/m3</div>
                </div>
                <div className="rounded-[8px] bg-slate-50 px-3 py-2">
                  <div className="text-xs font-medium text-slate-500">Observed range</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">
                    {historicalState.stats.min.toFixed(1)} - {historicalState.stats.max.toFixed(1)}
                  </div>
                </div>
              </div>
            ) : null}
            <div className="text-xs text-gray-500">PM2.5 (ug/m3)</div>
            <div className="mt-2 h-[170px]">
              {historicalState.isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-600">Loading...</div>
              ) : historicalState.error ? (
                <div className="flex h-full items-center justify-center text-sm text-red-700">{historicalState.error}</div>
              ) : !historicalState.points?.length ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-600">No data.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {(() => {
                    const yValues = historicalState.points
                      ?.map((p) => p.pm25)
                      .filter((v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 500) // clamp to realistic PM2.5 range
                    const max = yValues?.length ? Math.max(...yValues) : 0
                    const yMax = Math.max(10, Math.ceil(max / 5) * 5)

                    return (
                      <AreaChart data={historicalState.points} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pm25Fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="x"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickFormatter={(d: any) => {
                        const dt = d instanceof Date ? d : new Date(d)
                        return historicalState.mode === "hourly"
                          ? dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                          : dt.toLocaleDateString(undefined, { month: "short", day: "2-digit" })
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickMargin={8}
                      width={44}
                      domain={[0, yMax]}
                      tickCount={5}
                      tickFormatter={(v: any) => (typeof v === "number" ? v.toFixed(0) : v)}
                    />
                    <Tooltip
                      formatter={(v: any) => [`${typeof v === "number" ? v.toFixed(1) : v}`, "PM2.5"]}
                      labelFormatter={(d: any) => {
                        const dt = d instanceof Date ? d : new Date(d)
                        return historicalState.mode === "hourly"
                          ? dt.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                          : dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="pm25"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#pm25Fill)"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                      </AreaChart>
                    )
                  })()}
                </ResponsiveContainer>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// Add delay utility function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Create a function to fetch with retries
const fetchWithRetry = async (fetchFn: () => Promise<any>, retries = 3, initialDelay = 2000, backoffFactor = 1.5) => {
  let currentDelay = initialDelay

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        await delay(currentDelay)
      }
      const result = await fetchFn()
      if (result) return result
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed, retrying...`)
      currentDelay *= backoffFactor
      if (attempt === retries - 1) throw error
    }
  }
  return null
}

// Create a component for the map nodes
const MapNodes: React.FC<{
  onLoadingChange: (state: LoadingState) => void
  showEmojis: boolean
  onNodeSelect: (node: MapNode) => void
}> = ({ onLoadingChange, showEmojis, onNodeSelect }) => {
  const map = useMap()
  const [nodes, setNodes] = useState<MapNode[]>([])
  const markersRef = useRef<L.Marker[]>([])
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Validate node data
  const isValidNode = (node: MapNode): boolean => {
    return !!(
      node &&
      node.siteDetails?.approximate_latitude &&
      node.siteDetails?.approximate_longitude &&
      node.siteDetails?.name &&
      node.pm2_5?.value !== undefined
    )
  }

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        onLoadingChange({ isLoading: true, error: null })

        const data = await fetchWithRetry(getMapNodes, 3, 2000, 1.5)

        if (data) {
          const validNodes = data.filter(isValidNode)
          if (validNodes.length === 0) {
            onLoadingChange({
              isLoading: false,
              error: "No valid data points found",
            })
            return
          }
          setNodes(validNodes)
          onLoadingChange({ isLoading: false, error: null })
        } else {
          onLoadingChange({
            isLoading: false,
            error: "Failed to load map data",
          })
        }
      } catch (error) {
        console.error("Error fetching nodes:", error)
        onLoadingChange({
          isLoading: false,
          error: "Error loading map data",
        })
      }
    }

    fetchNodes()

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [map, onLoadingChange])

  useEffect(() => {
    if (!nodes.length) return

    try {
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      if (showEmojis) {
        nodes.forEach((node) => {
          try {
            const latitude = node?.siteDetails?.approximate_latitude
            const longitude = node?.siteDetails?.approximate_longitude
            const siteName =
              node?.siteDetails?.name ||
              node?.siteDetails?.formatted_name ||
              node?.siteDetails?.location_name ||
              "Unknown Location"
            const pm25Value = node?.pm2_5?.value
            const timestamp = node?.time
            const aqiCategory = node?.aqi_category ?? "Unknown"

            if (
              typeof latitude !== "number" ||
              !Number.isFinite(latitude) ||
              typeof longitude !== "number" ||
              !Number.isFinite(longitude) ||
              pm25Value === undefined
            ) {
              console.warn("Skipping node due to missing data:", node._id)
              return
            }

            // Create custom icon for the marker
            const customIcon = getCustomIcon(aqiCategory)
            const marker = L.marker([latitude, longitude], {
              icon: customIcon,
              opacity: 1, // Ensure emoji is always visible
            }).addTo(map)

            // Create a container for the popup
            const container = document.createElement("div")
            const root = ReactDOM.createRoot(container)

            // Bind popup but don't open it automatically
            root.render(
              <PopupContent
                label={siteName}
                data={{
                  pm2_5_prediction: pm25Value ?? undefined,
                  timestamp: timestamp ?? undefined,
                }}
                onClose={() => {
                  marker.closePopup()
                  root.unmount()
                }}
              />,
            )

            marker.bindPopup(container, {
              ...customPopupOptions,
              offset: L.point(0, -20),
            })

            // Ensure React tree is released on marker removal
            marker.on("remove", () => {
              try {
                root.unmount()
              } catch (error) {
                console.error("Error unmounting React tree:", error)
              }
            })

            // Handle click to open popup
            marker.on("click", (e: any) => {
              try {
                L.DomEvent.stopPropagation(e)
              } catch {}
              onNodeSelect(node)

              // Zoom in and center on the selected site
              try {
                const currentZoom = map.getZoom()
                const targetZoom = Math.max(currentZoom, 11)
                map.flyTo([latitude, longitude], targetZoom, { animate: true, duration: 0.8 })
              } catch (error) {
                console.error("Error centering map on selected site:", error)
              }

              // Close other popups
              markersRef.current.forEach((m) => {
                if (m !== marker) {
                  m.closePopup()
                }
              })
              marker.openPopup()
            })

            // Handle hover to open popup and ensure emoji visibility
            marker.on("mouseover", () => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
                hoverTimeoutRef.current = null
              }
              marker.setOpacity(1) // Ensure emoji stays visible
              // Close other popups
              markersRef.current.forEach((m) => {
                if (m !== marker) {
                  m.closePopup()
                }
              })
              marker.openPopup()
            })

            // Handle mouseout to close popup with a delay
            marker.on("mouseout", () => {
              hoverTimeoutRef.current = setTimeout(() => {
                marker.closePopup()
              }, 100) // Small delay to prevent flickering
            })

            // Handle popup events to manage hover behavior
            marker.on("popupopen", () => {
              const popup = marker.getPopup()
              if (popup) {
                const popupElement = popup.getElement()
                if (popupElement) {
                  popupElement.addEventListener("mouseenter", () => {
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current)
                      hoverTimeoutRef.current = null
                    }
                    marker.setOpacity(1) // Keep emoji visible
                  })
                  popupElement.addEventListener("mouseleave", () => {
                    hoverTimeoutRef.current = setTimeout(() => {
                      marker.closePopup()
                    }, 100)
                  })
                }
              }
            })

            markersRef.current.push(marker)
          } catch (error) {
            console.error("Error creating marker for node:", node._id, error)
          }
        })
      }
    } catch (error) {
      console.error("Error updating markers:", error)
      onLoadingChange({
        isLoading: false,
        error: "Error displaying map markers",
      })
    }
  }, [nodes, map, onLoadingChange, showEmojis])

  return null
}

const ClearSelectionOnMapClick: React.FC<{ onClear: () => void }> = ({ onClear }) => {
  useMapEvents({
    click: () => {
      onClear()
    },
  })
  return null
}

interface HeatmapData {
  bounds: [[number, number], [number, number]]
  city: string
  id: string
  image: string
  message: string
}

// Combined Map Controls Component
const MapControls: React.FC<{
  showHeatmaps: boolean
  setShowHeatmaps: (value: boolean) => void
  showEmojis: boolean
  setShowEmojis: (value: boolean) => void
}> = ({ showHeatmaps, setShowHeatmaps, showEmojis, setShowEmojis }) => {
  const map = useMap()

  const captureMapView = async () => {
    try {
      const mapContainer = map.getContainer()
      const { default: html2canvas } = await import("html2canvas")
      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        width: mapContainer.offsetWidth,
        height: mapContainer.offsetHeight,
      })

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `map-view-${new Date().toISOString().split("T")[0]}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }, "image/png")
    } catch (error) {
      console.error("Error capturing map view:", error)
      alert("Failed to capture map view. Please try again.")
    }
  }

  useEffect(() => {
    const MapControls = L.Control.extend({
      onAdd: () => {
        const container = L.DomUtil.create("div", "leaflet-control leaflet-bar")
        container.style.backgroundColor = "white"
        container.style.padding = "12px"
        container.style.borderRadius = "8px"
        container.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"
        container.style.cursor = "pointer"
        container.style.userSelect = "none"
        container.style.display = "flex"
        container.style.flexDirection = "column"
        container.style.gap = "8px"
        container.style.minWidth = "160px"

        // Heatmap toggle button
        const heatmapButton = L.DomUtil.create("button", "", container)
        heatmapButton.innerHTML = showHeatmaps ? "Heatmap ON" : "Heatmap OFF"
        heatmapButton.style.border = "none"
        heatmapButton.style.background = showHeatmaps ? "#dbeafe" : "transparent"
        heatmapButton.style.fontSize = "13px"
        heatmapButton.style.fontWeight = showHeatmaps ? "600" : "500"
        heatmapButton.style.color = showHeatmaps ? "#1d4ed8" : "#374151"
        heatmapButton.style.textAlign = "left"
        heatmapButton.style.padding = "8px 12px"
        heatmapButton.style.borderRadius = "6px"
        heatmapButton.style.transition = "all 0.2s"
        heatmapButton.title = showHeatmaps ? "Hide Heatmap" : "Show Heatmap"

        L.DomEvent.on(heatmapButton, "click", (e) => {
          L.DomEvent.stopPropagation(e)
          setShowHeatmaps(!showHeatmaps)
        })

        // Emoji toggle button
        const emojiButton = L.DomUtil.create("button", "", container)
        emojiButton.innerHTML = showEmojis ? "Emojis ON" : "Emojis OFF"
        emojiButton.style.border = "none"
        emojiButton.style.background = showEmojis ? "#dcfce7" : "transparent"
        emojiButton.style.fontSize = "13px"
        emojiButton.style.fontWeight = showEmojis ? "600" : "500"
        emojiButton.style.color = showEmojis ? "#166534" : "#374151"
        emojiButton.style.textAlign = "left"
        emojiButton.style.padding = "8px 12px"
        emojiButton.style.borderRadius = "6px"
        emojiButton.style.transition = "all 0.2s"
        emojiButton.title = showEmojis ? "Hide Emojis" : "Show Emojis"

        L.DomEvent.on(emojiButton, "click", (e) => {
          L.DomEvent.stopPropagation(e)
          setShowEmojis(!showEmojis)
        })

        // Download map view button
        const downloadMapButton = L.DomUtil.create("button", "", container)
        downloadMapButton.innerHTML = "Capture View"
        downloadMapButton.style.border = "none"
        downloadMapButton.style.background = "#f3e8ff"
        downloadMapButton.style.fontSize = "13px"
        downloadMapButton.style.fontWeight = "500"
        downloadMapButton.style.color = "#7c3aed"
        downloadMapButton.style.textAlign = "left"
        downloadMapButton.style.padding = "8px 12px"
        downloadMapButton.style.borderRadius = "6px"
        downloadMapButton.style.transition = "all 0.2s"
        downloadMapButton.title = "Capture current map view as image"

        L.DomEvent.on(downloadMapButton, "click", (e) => {
          L.DomEvent.stopPropagation(e)
          captureMapView()
        })

        return container
      },
    })

    const mapControls = new MapControls({ position: "topleft" })
    map.addControl(mapControls)

    return () => {
      map.removeControl(mapControls)
    }
  }, [map, showHeatmaps, setShowHeatmaps, showEmojis, setShowEmojis])

  return null
}

const HeatmapOverlays: React.FC<{
  onLoadingChange: (state: LoadingState) => void
  showHeatmaps: boolean
  setShowHeatmaps: (value: boolean) => void
  showEmojis: boolean
  setShowEmojis: (value: boolean) => void
}> = ({ onLoadingChange, showHeatmaps, setShowHeatmaps, showEmojis, setShowEmojis }) => {
  const map = useMap()
  const [heatmaps, setHeatmaps] = useState<HeatmapData[]>([])
  const overlaysRef = useRef<L.ImageOverlay[]>([])

  useEffect(() => {
    const fetchHeatmaps = async () => {
      try {
        onLoadingChange({ isLoading: true, error: null })

        const data = await fetchWithRetry(getHeatmapData, 3, 2000, 1.5)

        if (data && Array.isArray(data)) {
          setHeatmaps(data)
          onLoadingChange({ isLoading: false, error: null })
        } else {
          onLoadingChange({
            isLoading: false,
            error: "No heatmap data available",
          })
        }
      } catch (error) {
        console.error("Error fetching heatmap data:", error)
        onLoadingChange({
          isLoading: false,
          error: "Error loading heatmap data",
        })
      }
    }

    fetchHeatmaps()
  }, [onLoadingChange])

  useEffect(() => {
    if (!heatmaps.length) return

    overlaysRef.current.forEach((overlay) => overlay.remove())
    overlaysRef.current = []

    if (showHeatmaps) {
      heatmaps.forEach((heatmap) => {
        try {
          if (!heatmap.bounds || !Array.isArray(heatmap.bounds) || heatmap.bounds.length !== 2) {
            console.warn(`Invalid bounds for heatmap ${heatmap.city}:`, heatmap.bounds)
            return
          }

          const [[south, west], [north, east]] = heatmap.bounds

          if (
            typeof south !== "number" ||
            typeof west !== "number" ||
            typeof north !== "number" ||
            typeof east !== "number"
          ) {
            console.warn(`Invalid coordinate values for heatmap ${heatmap.city}`)
            return
          }

          const imageOverlay = L.imageOverlay(
            heatmap.image,
            [
              [south, west],
              [north, east],
            ],
            {
              opacity: 0.7,
              interactive: true,
              alt: `Heatmap for ${heatmap.city}`,
            },
          ).addTo(map)

          overlaysRef.current.push(imageOverlay)
        } catch (error) {
          console.error(`Error creating overlay for ${heatmap.city}:`, error)
        }
      })
    }

    return () => {
      overlaysRef.current.forEach((overlay) => overlay.remove())
    }
  }, [heatmaps, showHeatmaps, map])

  return (
    <MapControls
      showHeatmaps={showHeatmaps}
      setShowHeatmaps={setShowHeatmaps}
      showEmojis={showEmojis}
      setShowEmojis={setShowEmojis}
    />
  )
}

// Update the Legend component with better tooltip styling
const Legend: React.FC = () => {
  const pollutantLevels = useMemo(
    () => [
      {
        range: "0.0 ug/m3 - 9.0 ug/m3",
        label: "Air Quality is Good",
        image: GoodAir,
      },
      {
        range: "9.1 ug/m3 - 35.4 ug/m3",
        label: "Air Quality is Moderate",
        image: Moderate,
      },
      {
        range: "35.5 ug/m3 - 55.4 ug/m3",
        label: "Air Quality is Unhealthy for Sensitive Groups",
        image: UnhealthySG,
      },
      {
        range: "55.5 ug/m3 - 125.4 ug/m3",
        label: "Air Quality is Unhealthy",
        image: Unhealthy,
      },
      {
        range: "125.5 ug/m3 - 225.4 ug/m3",
        label: "Air Quality is Very Unhealthy",
        image: VeryUnhealthy,
      },
      {
        range: "225.5+ ug/m3",
        label: "Air Quality is Hazardous",
        image: Hazardous,
      },
    ],
    [],
  )

  return (
    <div className="leaflet-bottom leaflet-left z-[1000] m-4">
      <div className="leaflet-control bg-white p-2 rounded-full shadow-md">
        <div className="flex flex-col gap-2">
          {pollutantLevels.map((level, index) => (
            <div key={index} className="flex items-center gap-2 group relative">
              <div className="w-8 h-8 relative cursor-pointer">
                <Image src={level.image || "/placeholder.svg"} alt={level.label} fill className="object-contain" />
                <div className="opacity-0 group-hover:opacity-100 absolute left-full ml-2 bg-white text-gray-800 text-xs rounded-lg px-3 py-2 whitespace-nowrap transition-opacity duration-200 shadow-lg border border-gray-200 min-w-[200px]">
                  <div className="font-semibold mb-1">{level.label}</div>
                  <div className="text-gray-600">{level.range}</div>
                  <div className="absolute w-2 h-2 left-0 top-1/2 -ml-1 -mt-1 bg-white border-l border-t border-gray-200 transform -rotate-45"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Map Layer Control Component
const MapLayerButton: React.FC = () => {
  const map = useMap()
  const [currentStyle, setCurrentStyle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mapStyle") || "streets"
    }
    return "streets"
  })

  const mapStyles = {
    streets: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
    satellite: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
    dark: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
    light: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
    outdoors: `https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
    navigation: `https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
  }

  const handleStyleChange = (style: string) => {
    console.log("Changing map style to:", style)
    setCurrentStyle(style)

    if (typeof window !== "undefined") {
      localStorage.setItem("mapStyle", style)
    }

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer)
      }
    })

    L.tileLayer(mapStyles[style as keyof typeof mapStyles], {
      attribution:
        '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      tileSize: 512,
      zoomOffset: -1,
    }).addTo(map)
  }

  return (
    <div className="leaflet-top leaflet-right z-[1000] mt-16 mr-4">
      <div className="leaflet-control">
        <MapLayerControl onStyleChange={handleStyleChange} currentStyle={currentStyle} />
      </div>
    </div>
  )
}

// Update the LeafletMap component
const LeafletMap: React.FC = () => {
  const defaultCenter: [number, number] = [1.5, 17.5]
  const defaultZoom = 4
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null,
  })
  const [showEmojis, setShowEmojis] = useState(true)
  const [showHeatmaps, setShowHeatmaps] = useState(false)
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null)
  const [forecastState, setForecastState] = useState<ForecastState>({
    isLoading: false,
    error: null,
    collection: null,
  })

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!mapboxToken) {
    console.warn("Mapbox token is not set in environment variables. Map functionality may be limited.")
  }

  const initialMapStyle = typeof window !== "undefined" ? localStorage.getItem("mapStyle") || "streets" : "streets"

  const mapStyles = {
    streets: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
    satellite: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
    dark: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
    light: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
    outdoors: `https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
    navigation: `https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
  }

  useEffect(() => {
    let isActive = true
    setForecastState((current) =>
      current.collection ? current : { isLoading: true, error: null, collection: null },
    )

    getDailyForecastCollection()
      .then((collection) => {
        if (!isActive) return
        if (!collection?.forecasts?.length) {
          setForecastState({ isLoading: false, error: "No forecast coverage was returned.", collection: null })
          return
        }
        setForecastState({ isLoading: false, error: null, collection })
      })
      .catch((error) => {
        if (!isActive) return
        console.error(error)
        setForecastState({ isLoading: false, error: "Failed to load forecast coverage.", collection: null })
      })

    return () => {
      isActive = false
    }
  }, [])

  const isPanelOpen = !!selectedNode

  return (
    <div className="h-full w-full">
      <div className="flex h-full w-full">
        <div className="relative flex-1">
          <LoadingIndicator isLoading={loadingState.isLoading} error={loadingState.error} />
          <ForecastStatusBadge forecastState={forecastState} />
          <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url={mapStyles[initialMapStyle as keyof typeof mapStyles]}
              attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              tileSize={512}
              zoomOffset={-1}
            />
            <SearchControl defaultCenter={defaultCenter} defaultZoom={defaultZoom} />
            <ClearSelectionOnMapClick onClear={() => setSelectedNode(null)} />
            <MapNodes onLoadingChange={setLoadingState} showEmojis={showEmojis} onNodeSelect={setSelectedNode} />
            <HeatmapOverlays
              onLoadingChange={setLoadingState}
              showHeatmaps={showHeatmaps}
              setShowHeatmaps={setShowHeatmaps}
              showEmojis={showEmojis}
              setShowEmojis={setShowEmojis}
            />
            <Legend />
            <MapLayerButton />
          </MapContainer>
        </div>

        <div
          className={[
            "h-full overflow-hidden transition-[width] duration-300 ease-out",
            isPanelOpen ? "w-[448px]" : "w-0",
          ].join(" ")}
          aria-hidden={!isPanelOpen}
        >
          {isPanelOpen ? (
            <ForecastPanel selectedNode={selectedNode} forecastState={forecastState} onClose={() => setSelectedNode(null)} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

// Create a custom icon based on AQI category
const getCustomIcon = (aqiCategory: string) => {
  const imageSrc = getAqiImageByCategory(aqiCategory)

  return L.icon({
    iconUrl: imageSrc,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  })
}

export default LeafletMap

