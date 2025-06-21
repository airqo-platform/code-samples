"use client"
import { Button } from "@/ui/button"
import { Wind } from "lucide-react"
import Image from "next/image"

interface WindLayerControlProps {
  isVisible: boolean
  onToggle: (visible: boolean) => void
}

export function WindLayerControl({ isVisible, onToggle }: WindLayerControlProps) {
  const handleToggle = () => {
    onToggle(!isVisible)
  }

  return (
    <div className="absolute top-28 left-4 z-[1000]">
      {/* Flex row for button and status */}
      <div className="flex items-center space-x-2">
        {/* Wind Button */}
        <Button
          onClick={handleToggle}
          className={`h-8 w-8 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 font-bold text-sm ${
            isVisible
              ? "bg-green-500 hover:bg-green-600 text-white shadow-green-200"
              : "bg-gray-400 hover:bg-gray-500 text-white shadow-gray-200"
          }`}
          aria-label={isVisible ? "Hide Wind Layer" : "Show Wind Layer"}
          title={isVisible ? "Hide Wind Animation" : "Show Wind Animation"}
        >
          <Wind size={16} />
        </Button>

        {/* Status indicator */}
        <span
          className={`text-xs px-2 py-1 rounded shadow transition-colors ${
            isVisible
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          Wind {isVisible ? "ON" : "OFF"}
        </span>
      </div>

      {/* Display image when Wind is visible */}
      {isVisible && (
        <div className="fixed bottom-4 right-24 z-[1000] max-w-[100px] sm:max-w-none">
          <Image
            src="/images/cams/nomads.png"
            alt="Wind Data Source"
            width={120}
            height={60}
            className="rounded-lg"
            priority={true}
          />
        </div>
      )}
    </div>
  )
}