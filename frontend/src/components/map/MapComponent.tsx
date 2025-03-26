"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, useMap, Marker, Polygon } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Location } from "@/lib/types"
import { NavigationControls } from "./NavigationControls"
import { Button } from "@/ui/button"
import { MapIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover"

// Ensure window.map is properly typed
declare global {
  interface Window {
    map?: L.Map
  }
}

// Fix for default markers
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

const mapStyles = {
  streets: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
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

function MapStyleControl() {
  const map = useMap()
  const [currentStyle, setCurrentStyle] = useState<MapStyle>("streets")

  const changeStyle = (style: MapStyle) => {
    setCurrentStyle(style)
    // Find and remove the existing tile layer
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer)
      }
    })
    // Add the new tile layer
    L.tileLayer(mapStyles[style], {
      attribution:
        style === "satellite"
          ? '&copy; <a href="https://www.arcgis.com/">ESRI</a>'
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
  }

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10 bg-white shadow-lg">
            <MapIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2" style={{ zIndex: 2000 }}>
          {Object.keys(mapStyles).map((style) => (
            <Button
              key={style}
              variant={currentStyle === style ? "secondary" : "ghost"}
              className="w-full justify-start text-sm capitalize mb-1"
              onClick={() => changeStyle(style as MapStyle)}
            >
              {style}
            </Button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  )
}

function MapController() {
  const map = useMap()

  useEffect(() => {
    if (map) {
      window.map = map
    }

    return () => {
      // Clean up reference when component unmounts
      if (window.map === map) {
        delete window.map
      }
    }
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

export default function MapComponent({
  polygon,
  mustHaveLocations,
  suggestedLocations,
  onPolygonChange,
  // onLocationClick,
  isDrawing,
}: MapComponentProps) {
  return (
    <div className="relative pr-[420px]">
      <MapContainer
        center={[1.3733, 32.2903]} // Uganda center
        zoom={7}
        className="h-screen w-full"
      >
        <MapController />
        <MapStyleControl />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={mapStyles.streets}
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
          />
        ))}

        {suggestedLocations.map((location, index) => (
          <Marker
            key={`suggested-${location.lat}-${location.lng}-${index}`}
            position={[location.lat, location.lng]}
            icon={blueIcon}
          />
        ))}
      </MapContainer>

      <NavigationControls />
    </div>
  )
}

