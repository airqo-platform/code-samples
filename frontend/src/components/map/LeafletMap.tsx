"use client"

import "leaflet/dist/leaflet.css"
import type React from "react"
import { useEffect, useRef, useState, useMemo } from "react"
import ReactDOM from "react-dom/client"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import Image from "next/image"
import L from "leaflet"
import { GeoSearchControl } from "leaflet-geosearch"
import "leaflet-geosearch/dist/geosearch.css"
import html2canvas from "html2canvas"
// Use direct URLs for Leaflet marker icons
const markerIconUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png"
const markerShadowUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
import { getSatelliteData, getMapNodes, getHeatmapData } from "@/services/apiService"
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
          ✕
        </button>
      </div>
      <div className="text-sm font-medium mb-2">{label}</div>
      <div className="text-lg font-semibold mb-1">{level}</div>
      <div className="text-sm text-gray-700">PM2.5: {data.pm2_5_prediction?.toFixed(1) ?? "N/A"} µg/m³</div>
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
        ✕
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
        ✕
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
}> = ({ onLoadingChange, showEmojis }) => {
  const map = useMap()
  const [nodes, setNodes] = useState<MapNode[]>([])
  const markersRef = useRef<L.Marker[]>([])

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
    }
  }, [map, onLoadingChange])

  useEffect(() => {
    if (!nodes.length) return

    try {
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

            const container = document.createElement("div")
            const root = ReactDOM.createRoot(container)

            const marker = L.marker([latitude, longitude], {
              icon: getCustomIcon(aqiCategory),
            }).addTo(map)
            // Ensure React tree is released in all close/remove paths
            marker.on("popupclose", () => {
              try {
                root.unmount()
              } catch (error) {
                console.error("Error unmounting React tree:", error)
              }
            })
            marker.on("remove", () => {
              try {
                root.unmount()
              } catch (error) {
                console.error("Error unmounting React tree:", error)
              }
            })
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

            marker.on("mouseover", () => {
              markersRef.current.forEach((m) => {
                if (m !== marker) {
                  m.closePopup()
                }
              })
              marker.openPopup()
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
        heatmapButton.innerHTML = showHeatmaps ? "🗺️ Heatmap ON" : "🗺️ Heatmap OFF"
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
        emojiButton.innerHTML = showEmojis ? "😷 Emojis ON" : "😷 Emojis OFF"
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
        downloadMapButton.innerHTML = "📸 Capture View"
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
        range: "0.0µg/m³ - 9.0µg/m³",
        label: "Air Quality is Good",
        image: GoodAir,
      },
      {
        range: "9.1µg/m³ - 35.4µg/m³",
        label: "Air Quality is Moderate",
        image: Moderate,
      },
      {
        range: "35.5µg/m³ - 55.4µg/m³",
        label: "Air Quality is Unhealthy for Sensitive Groups",
        image: UnhealthySG,
      },
      {
        range: "55.5µg/m³ - 125.4µg/m³",
        label: "Air Quality is Unhealthy",
        image: Unhealthy,
      },
      {
        range: "125.5µg/m³ - 225.4µg/m³",
        label: "Air Quality is Very Unhealthy",
        image: VeryUnhealthy,
      },
      {
        range: "225.5+ µg/m³",
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

  return (
    <div className="relative w-full h-full">
      <LoadingIndicator isLoading={loadingState.isLoading} error={loadingState.error} />
      <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: "100vh", width: "100%" }}>
        <TileLayer
          url={mapStyles[initialMapStyle as keyof typeof mapStyles]}
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          tileSize={512}
          zoomOffset={-1}
        />
        <SearchControl defaultCenter={defaultCenter} defaultZoom={defaultZoom} />
        <MapNodes onLoadingChange={setLoadingState} showEmojis={showEmojis} />
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
  )
}

// Create a custom icon based on AQI category
const getCustomIcon = (aqiCategory: string) => {
  let imageSrc
  switch (aqiCategory.toLowerCase()) {
    case "good":
      imageSrc = GoodAir
      break
    case "moderate":
      imageSrc = Moderate
      break
    case "unhealthy for sensitive groups":
      imageSrc = UnhealthySG
      break
    case "unhealthy":
      imageSrc = Unhealthy
      break
    case "very unhealthy":
      imageSrc = VeryUnhealthy
      break
    case "hazardous":
      imageSrc = Hazardous
      break
    default:
      imageSrc = Invalid
  }

  return L.icon({
    iconUrl: imageSrc,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  })
}

export default LeafletMap
