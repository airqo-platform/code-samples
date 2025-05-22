"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, useMap, Marker, Polygon } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Location } from "@/lib/types"
import { NavigationControls } from "./NavigationControls"
import { MapLayerControl } from "./MapLayerControl"
import { fetchHeatmapData } from "@/services/heatmapService"
import MapOverlayToggle from "../Controls/MapOverlayToggle"
import type { AirQualityDataPoint } from "@/services/heatmapService"
import LoadingSpinner from "@/ui/loading"
// import MapboxGLOverlay from './MapboxGLOverlay'

delete (L.Icon.Default.prototype as any)._getIconUrl

// Create custom icons for different marker types
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  shadowSize: [41, 41],
})

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  shadowSize: [41, 41],
})

// Update the mapStyles object to include more Mapbox styles
const mapStyles = {
  streets: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
  satellite: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
  dark: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
  light: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
}

type MapStyle = keyof typeof mapStyles

interface MapComponentProps {
  polygon: Location[]
  mustHaveLocations: Location[]
  suggestedLocations: Location[]
  onPolygonChange: (locations: Location[]) => void
  onLocationClick: (location: Location) => void
  isDrawing: boolean
}

// Add map instance to window for global access
declare global {
  interface Window {
    map: L.Map
  }
}

function MapController() {
  const map = useMap()
  useEffect(() => {
    window.map = map
  }, [map])
  return null
}

function DrawControl({
  onPolygonChange,
}: {
  onPolygonChange: (locations: Location[]) => void
}) {
  const map = useMap()
  const drawingRef = useRef<L.Polyline>()
  const locationsRef = useRef<Location[]>([])

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      const newLocation = { lat: e.latlng.lat, lng: e.latlng.lng }
      locationsRef.current = [...locationsRef.current, newLocation]

      if (!drawingRef.current) {
        drawingRef.current = L.polyline([], { color: "blue" }).addTo(map)
      }

      drawingRef.current.setLatLngs(locationsRef.current)
      onPolygonChange(locationsRef.current)
    }

    map.on("click", handleClick)

    return () => {
      map.off("click", handleClick)
      drawingRef.current?.remove()
    }
  }, [map, onPolygonChange])

  return null
}

// Add a check for the Mapbox token at the beginning of the component
export default function MapComponent({
  polygon,
  mustHaveLocations,
  suggestedLocations,
  onPolygonChange,
  onLocationClick,
  isDrawing,
}: MapComponentProps) {
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false)
  const [heatMapData, setHeatMapData] = useState<AirQualityDataPoint[] | null>(null)
  const [currentStyle, setCurrentStyle] = useState<MapStyle>("streets")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Toggle heatmap visibility
  const toggleHeatmap = () => {
    if (!showHeatmap && !heatMapData) {
      // First time toggling on, fetch data
      setIsLoading(true)
      fetchHeatmapData()
        .then((data) => {
          setHeatMapData(data)
          setShowHeatmap(true)
          console.log("Heatmap data loaded:", data.length, "points")
        })
        .catch((err) => {
          console.error("Failed to load heatmap data:", err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      // Just toggle visibility if data is already loaded
      setShowHeatmap(!showHeatmap)
    }
  }

  const handleStyleChange = (style: string) => {
    console.log("Changing map style to:", style)
    setCurrentStyle(style as MapStyle)

    // Find and remove the existing tile layer
    window.map?.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        window.map.removeLayer(layer)
      }
    })

    // Add the new tile layer with Mapbox-specific options
    if (window.map) {
      L.tileLayer(mapStyles[style as MapStyle], {
        attribution:
          '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        tileSize: 512,
        zoomOffset: -1,
      }).addTo(window.map)
    }
  }

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!mapboxToken) {
    console.warn("Mapbox token is not set in environment variables. Map functionality may be limited.")
  }

  return (
    <div className="relative pr-[420px]">
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-3">
        <MapLayerControl onStyleChange={handleStyleChange} currentStyle={currentStyle} />
        <MapOverlayToggle onClick={toggleHeatmap} isActive={showHeatmap} />
        {isLoading && (
          <div className="bg-white bg-opacity-75 p-2 rounded-md shadow-md">
            <LoadingSpinner />
          </div>
        )}
      </div>
      
      <MapContainer
        center={[1.3733, 32.2903]} // Uganda center
        zoom={7}
        className="h-screen w-full"
      >
        <MapController />
        <TileLayer
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={mapStyles.streets}
          tileSize={512}
          zoomOffset={-1}
        />

        {isDrawing && <DrawControl onPolygonChange={onPolygonChange} />}

        {polygon.length > 2 && (
          <Polygon positions={polygon.map((loc) => [loc.lat, loc.lng])} pathOptions={{ color: "blue" }} />
        )}

        {mustHaveLocations.map((location, index) => (
          <Marker
            key={`must-have-${location.lat}-${location.lng}-${index}`}
            position={[location.lat, location.lng]}
            icon={greenIcon}
            eventHandlers={{
              click: () => onLocationClick(location)
            }}
          />
        ))}

        {suggestedLocations.map((location, index) => (
          <Marker
            key={`suggested-${location.lat}-${location.lng}-${index}`}
            position={[location.lat, location.lng]}
            icon={blueIcon}
            eventHandlers={{
              click: () => onLocationClick(location)
            }}
          />
        ))}
        
        {/* Replace HeatmapOverlay with MapboxGLOverlay */}
        {showHeatmap && heatMapData && <MapboxGLOverlay data={heatMapData} />}
      </MapContainer>

      <NavigationControls />
    </div>
  )
}