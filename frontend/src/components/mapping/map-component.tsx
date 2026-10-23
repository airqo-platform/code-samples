"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, useMap, Marker, Polygon } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Location } from "@/lib/types"
import { MapLayerControl } from "./map-layer-control"
import { MapInstanceBridge } from "./map-instance-bridge"
import { MapSearchControl } from "./map-search-control"
import { MapZoomControls } from "./map-control-button"
import { InitialCountryView } from "./initial-country-view"
import { getMapTileConfig, configureLeafletDefaultIcons, type MapStyle } from "@/lib/map-config"

// Keep Leaflet's default marker assets local so Next.js never requests /marker-icon.png.
configureLeafletDefaultIcons()

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

interface MapComponentProps {
  polygon: Location[]
  mustHaveLocations: Location[]
  suggestedLocations: Location[]
  onPolygonChange: (locations: Location[]) => void
  onLocationClick: (location: Location) => void
  isDrawing: boolean
  isSelectingPriority: boolean
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

function FitMapToData({
  polygon,
  mustHaveLocations,
  suggestedLocations,
}: Pick<MapComponentProps, "polygon" | "mustHaveLocations" | "suggestedLocations">) {
  const map = useMap()

  useEffect(() => {
    const locations = [...polygon, ...mustHaveLocations, ...suggestedLocations]
    if (!locations.length) return

    const bounds = L.latLngBounds(locations.map((location) => [location.lat, location.lng]))
    if (!bounds.isValid()) return

    if (locations.length === 1) {
      map.flyTo(bounds.getCenter(), 13, { duration: 0.8 })
      return
    }

    map.fitBounds(bounds, {
      paddingTopLeft: [48, 110],
      paddingBottomRight: [48, 48],
      maxZoom: 14,
      animate: true,
    })
  }, [map, mustHaveLocations, polygon, suggestedLocations])

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

function PriorityLocationControl({ onLocationClick }: { onLocationClick: (location: Location) => void }) {
  const map = useMap()

  useEffect(() => {
    const handleClick = (event: L.LeafletMouseEvent) => {
      onLocationClick({ lat: event.latlng.lat, lng: event.latlng.lng })
    }

    map.getContainer().style.cursor = "crosshair"
    map.on("click", handleClick)

    return () => {
      map.getContainer().style.cursor = ""
      map.off("click", handleClick)
    }
  }, [map, onLocationClick])

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
  isSelectingPriority,
}: MapComponentProps) {
  const [currentStyle, setCurrentStyle] = useState<MapStyle>("streets")
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)

  const handleGeolocate = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      mapInstance?.flyTo([pos.coords.latitude, pos.coords.longitude], 13, { animate: true, duration: 0.8 })
    })
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[1.3733, 32.2903]} // Uganda center
        zoom={7}
        className="h-full w-full"
        zoomControl={false}
      >
        <MapController />
        <MapInstanceBridge onReady={setMapInstance} />
        <InitialCountryView
          disabled={polygon.length > 0 || mustHaveLocations.length > 0 || suggestedLocations.length > 0}
        />
        <FitMapToData
          polygon={polygon}
          mustHaveLocations={mustHaveLocations}
          suggestedLocations={suggestedLocations}
        />
        <TileLayer key={currentStyle} {...getMapTileConfig(currentStyle)} />

        {isDrawing && <DrawControl onPolygonChange={onPolygonChange} />}
        {isSelectingPriority && !isDrawing ? <PriorityLocationControl onLocationClick={onLocationClick} /> : null}

        {polygon.length > 2 && (
          <Polygon
            positions={polygon.map((loc) => [loc.lat, loc.lng])}
            pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.12, weight: 3 }}
          />
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

      <div className="absolute right-4 top-20 z-[1100]">
        <MapLayerControl
          onStyleChange={(style) => setCurrentStyle(style as MapStyle)}
          currentStyle={currentStyle}
        />
      </div>

      <MapSearchControl
        map={mapInstance}
        className="absolute left-3 top-3 z-[1100] w-[min(17rem,calc(100vw-12rem))]"
      />

      <MapZoomControls
        onGeolocate={handleGeolocate}
        onZoomIn={() => mapInstance?.zoomIn()}
        onZoomOut={() => mapInstance?.zoomOut()}
      />
    </div>
  )
}
