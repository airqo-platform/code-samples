"use client";

import { useEffect, useRef, Component, useCallback } from "react";
import type { WindData } from "@/types/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-velocity"; // Static import

interface WindMapProps {
  map: L.Map | null;
  isVisible: boolean;
  onLayerReady?: (layer: any) => void;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <div>Error loading wind map. Check console for details.</div>;
    return this.props.children;
  }
}

export default function WindMap({ map, isVisible, onLayerReady }: WindMapProps) {
  const velocityLayerRef = useRef<any>(null);
  const isLoadedRef = useRef(false);

  const fetchAndCreateWindLayer = useCallback(async () => {
    if (typeof window === "undefined" || !map) return;

    try {
      const velocityLayer = (L as any).velocityLayer || (L as any).VelocityLayer;
      if (!velocityLayer) throw new Error("velocityLayer function not found");

      const response = await fetch(process.env.NEXT_PUBLIC_WIND_API_URL as string, {
        method: "GET",
        cache: "force-cache" // ✅ Use cached version if available
      });

      if (!response.ok) throw new Error(`Failed to fetch wind data: ${response.status}`);
      const responseData = await response.json();
      const data: WindData[] = Array.isArray(responseData) ? responseData : [responseData];

      if (!data.length || !data[0]?.data) {
        console.error("Invalid wind data format:", data);
        return;
      }

      if (velocityLayerRef.current && map.hasLayer(velocityLayerRef.current)) {
        map.removeLayer(velocityLayerRef.current);
      }

      velocityLayerRef.current = velocityLayer({
        displayValues: true,
        displayOptions: {
          velocityType: "Global Wind",
          position: "bottomleft",
          emptyString: "No wind data",
          angleConvention: "bearingCW",
          showCardinal: true,
          speedUnit: "m/s",
          colorScale: ["#00f", "#0ff", "#0f0", "#ff0", "#f90", "#f00"],
        },
        data,
        maxVelocity: 25,
        velocityScale: 0.008,
        particleAge: 90,
        lineWidth: 2,
        particleMultiplier: 1 / 300,
      });

      isLoadedRef.current = true;

      if (isVisible) {
        velocityLayerRef.current.addTo(map);
      }

      onLayerReady?.(velocityLayerRef.current);
    } catch (error) {
      console.error("Error loading wind data:", error);
    }
  }, [map, isVisible, onLayerReady]);

  useEffect(() => {
    if (!map || isLoadedRef.current) return;
    fetchAndCreateWindLayer();

    return () => {
      if (velocityLayerRef.current && map) {
        try {
          map.removeLayer(velocityLayerRef.current);
        } catch (error) {
          console.warn("Cleanup error:", error);
        }
      }
    };
  }, [map, fetchAndCreateWindLayer]);

  useEffect(() => {
    if (!map || !velocityLayerRef.current) return;

    try {
      if (isVisible && !map.hasLayer(velocityLayerRef.current)) {
        velocityLayerRef.current.addTo(map);
      } else if (!isVisible && map.hasLayer(velocityLayerRef.current)) {
        map.removeLayer(velocityLayerRef.current);
      }
    } catch (error) {
      console.error("Error toggling wind layer visibility:", error);
    }
  }, [isVisible, map]);

  return <ErrorBoundary>{null}</ErrorBoundary>;
}
