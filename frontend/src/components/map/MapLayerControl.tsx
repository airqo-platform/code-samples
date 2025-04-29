"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Layers, X } from "lucide-react"
import { Button } from "@/ui/button"

interface MapLayerControlProps {
  onStyleChange: (style: string) => void
  currentStyle: string
}

// Map style options with preview images and labels
const mapStyleOptions = [
  {
    id: "streets",
    label: "Streets",
    previewUrl: "/images/map/street.webp", // Assuming there's a streets.webp file
    description: "Standard street map with labels",
  },
  {
    id: "light",
    label: "Light",
    previewUrl: "/images/map/light.webp",
    description: "Light-colored map for data visualization",
  },
  {
    id: "dark",
    label: "Dark",
    previewUrl: "/images/map/dark.webp",
    description: "Dark-colored map for night viewing",
  },
  {
    id: "satellite",
    label: "Satellite",
    previewUrl: "/images/map/satellite.webp",
    description: "Satellite imagery with street overlays",
  },
]

export function MapLayerControl({ onStyleChange, currentStyle }: MapLayerControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState(currentStyle)
  const modalRef = useRef<HTMLDivElement>(null)

  const handleApply = () => {
    onStyleChange(selectedStyle)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setSelectedStyle(currentStyle) // Reset to current style
    setIsOpen(false)
  }

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative">
      <Button
        onClick={() => {
          console.log("Opening map style selector")
          setIsOpen(!isOpen)
        }}
        className="h-12 w-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg flex items-center justify-center"
        aria-label="Change map style"
      >
        <Layers className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div
          ref={modalRef}
          className="absolute top-16 right-0 bg-white rounded-lg shadow-xl p-4 w-[320px] z-[2000]"
          style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Map Type</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-3 py-2">
            {mapStyleOptions.map((style) => (
              <div
                key={style.id}
                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedStyle === style.id ? "border-blue-500 shadow-md" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedStyle(style.id)}
              >
                <div className="relative h-20 w-full">
                  <Image src={style.previewUrl || "/placeholder.svg"} alt={style.label} fill className="object-cover" />
                </div>
                <div className="text-center py-1 text-sm font-medium">{style.label}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply} className="bg-blue-500 hover:bg-blue-600">
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
