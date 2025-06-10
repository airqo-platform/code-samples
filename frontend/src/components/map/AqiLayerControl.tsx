"use client"
import { Button } from "@/ui/button"
import { Wind } from "lucide-react"
import Image from "next/image"

interface AqiLayerControlProps {
  isVisible: boolean
  onToggle: (visible: boolean) => void
}

export function AqiLayerControl({ isVisible, onToggle }: AqiLayerControlProps) {
  const handleToggle = () => {
    onToggle(!isVisible)
  }

  return (
    <div className="absolute top-20 left-4 z-[1000]">
      <Button
        onClick={handleToggle}
        className={`h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isVisible
            ? "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200"
            : "bg-gray-400 hover:bg-gray-500 text-white shadow-gray-200"
        }`}
        aria-label={isVisible ? "Hide AQI Layer" : "Show AQI Layer"}
        title={isVisible ? "Hide AQI Heatmap" : "Show AQI Heatmap"}
      >
        <Wind className="h-6 w-6" />
      </Button>

      {/* Status indicator */}
      <div className="mt-2 text-center">
        <span
          className={`text-xs px-2 py-1 rounded shadow transition-colors ${
            isVisible
              ? "bg-blue-100 text-blue-800 border border-blue-200"
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          AQI PM<sub>2.5</sub> {isVisible ? "ON" : "OFF"}
        </span>
      </div>

      {/* Display image when AQI is visible */}
      {isVisible && (
        <div className="fixed bottom-4 right-4 z-[1000]">
          <Image
            src="/images/cams/Copernicus.png"
            alt="AQI Information"
            width={100}
            height={50}
            className="rounded-lg"
            unoptimized={true} 
          />
        </div>
      )}
    </div>
  )
}