"use client"
import { Button } from "@/ui/button"
import { Layers } from "lucide-react"

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
        className={`h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          isVisible ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-400 hover:bg-gray-500 text-white"
        }`}
        aria-label={isVisible ? "Hide AQI Layer" : "Show AQI Layer"}
        title={isVisible ? "Hide AQI Heatmap" : "Show AQI Heatmap"}
      >
        <Layers className="h-6 w-6" />
      </Button>

      {/* Optional label */}
      <div className="mt-2 text-center">
        <span className="text-xs bg-white px-2 py-1 rounded shadow text-gray-700">AQI Layer</span>
      </div>
    </div>
  )
}
