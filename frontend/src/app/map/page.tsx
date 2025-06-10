"use client"
import type React from "react"
import { useState, useRef } from "react"
import dynamic from "next/dynamic"
import Loading from "../Loading"
import Navigation from "@/components/navigation/navigation"
import { AqiLayerControl } from "@/components/map/AqiLayerControl"
import AqiHeatmap from "@/components/AqiHeatmap"
import type L from "leaflet"

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
  loading: () => <Loading />,
})

const MapPage: React.FC = () => {
  const [aqiLayerVisible, setAqiLayerVisible] = useState(true) // Default to visible
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const aqiLayerRef = useRef<L.ImageOverlay | null>(null)

  const handleMapReady = (map: L.Map) => {
    setMapInstance(map)
  }

  const handleAqiLayerReady = (layer: L.ImageOverlay) => {
    aqiLayerRef.current = layer
  }

  const handleAqiToggle = (visible: boolean) => {
    setAqiLayerVisible(visible)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Add Navigation Component */}
      <Navigation />

      {/* Map Container with Fixed Height */}
      <div className="flex-1 relative">
        <LeafletMap onMapReady={handleMapReady} />

        {/* AQI Layer Control */}
        <AqiLayerControl isVisible={aqiLayerVisible} onToggle={handleAqiToggle} />

        {/* AQI Heatmap Layer */}
        {mapInstance && <AqiHeatmap map={mapInstance} isVisible={aqiLayerVisible} onLayerReady={handleAqiLayerReady} />}
      </div>
    </div>
  )
}

export default MapPage
