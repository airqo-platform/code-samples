"use client"

import type React from "react"
import { useState, useRef } from "react"
import dynamic from "next/dynamic"
import Loading from "../Loading"
import Navigation from "@/components/navigation/navigation"
import { AqiLayerControl } from "@/components/map/AqiLayerControl"
import { WindLayerControl } from "@/components/map/WindLayerControl"
import type L from "leaflet"

// Dynamically import map components
const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
  loading: () => <Loading />,
})

const AqiHeatmap = dynamic(() => import("@/components/AqiHeatmap"), {
  ssr: false,
})

const WindMap = dynamic(() => import("@/components/WindMap"), {
  ssr: false,
})

const MapPage: React.FC = () => {
  const [aqiLayerVisible, setAqiLayerVisible] = useState(true)
  const [windLayerVisible, setWindLayerVisible] = useState(true)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)

  const aqiLayerRef = useRef<L.ImageOverlay | null>(null)
  const windLayerRef = useRef<any | null>(null)

  const handleMapReady = (map: L.Map) => {
    setMapInstance(map)
  }

  const handleAqiLayerReady = (layer: L.ImageOverlay) => {
    aqiLayerRef.current = layer
  }

  const handleWindLayerReady = (layer: any) => {
    windLayerRef.current = layer
  }

  const handleAqiToggle = (visible: boolean) => {
    console.log("AQI Layer toggle:", visible)
    setAqiLayerVisible(visible)
  }

  const handleWindToggle = (visible: boolean) => {
    console.log("Wind Layer toggle:", visible)
    setWindLayerVisible(visible)
  }

  return (
    <div className="flex flex-col h-screen">
      <Navigation />

      <div className="flex-1 relative">
        <LeafletMap onMapReady={handleMapReady} />

        {/* Layer Controls */}
        <AqiLayerControl isVisible={aqiLayerVisible} onToggle={handleAqiToggle} />
        <WindLayerControl isVisible={windLayerVisible} onToggle={handleWindToggle} />

        {/* Layers */}
        {mapInstance && (
          <>
            <AqiHeatmap
              map={mapInstance}
              isVisible={aqiLayerVisible}
              onLayerReady={handleAqiLayerReady}
            />
            <WindMap
              map={mapInstance}
              isVisible={windLayerVisible}
              onLayerReady={handleWindLayerReady}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default MapPage
