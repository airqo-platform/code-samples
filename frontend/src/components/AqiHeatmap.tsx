"use client"
import { useEffect, useRef } from "react"
import L from "leaflet"
import type { AqiMapData, MapProps } from "@/types/types"

interface AqiHeatmapProps extends MapProps {
  isVisible: boolean
  onLayerReady?: (layer: L.ImageOverlay) => void
}

export default function AqiHeatmap({ map, isVisible, onLayerReady }: AqiHeatmapProps) {
  const layerRef = useRef<L.ImageOverlay | null>(null)

  useEffect(() => {
    const fetchAndOverlayImage = async () => {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_AQI_API_URL as string)
        const data: AqiMapData = await res.json()

        const { image, bounds } = data.mapimage

        const imageBounds: L.LatLngBoundsExpression = bounds

        // Create the layer but don't add it to map yet
        const imageLayer = L.imageOverlay(image, imageBounds, {
          opacity: 0.3,
        })

        layerRef.current = imageLayer

        // Add to map if visible by default
        if (isVisible) {
          imageLayer.addTo(map)
        }

        // Notify parent component that layer is ready
        if (onLayerReady) {
          onLayerReady(imageLayer)
        }
      } catch (err) {
        console.error("Error loading AQI heatmap:", err)
      }
    }

    if (map) {
      fetchAndOverlayImage()
    }

    // Cleanup function
    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [map, onLayerReady])

  // Handle visibility changes
  useEffect(() => {
    if (layerRef.current && map) {
      if (isVisible) {
        if (!map.hasLayer(layerRef.current)) {
          layerRef.current.addTo(map)
        }
      } else {
        if (map.hasLayer(layerRef.current)) {
          map.removeLayer(layerRef.current)
        }
      }
    }
  }, [isVisible, map])

  return null
}
