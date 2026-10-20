"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { X, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MAP_STYLE_OPTIONS } from "@/lib/map-config"

interface MapLayerControlProps {
  onStyleChange: (style: string) => void
  currentStyle: string
}

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
          setIsOpen(!isOpen)
        }}
        className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:bg-primary/90"
        aria-label="Change map style"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Palette className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div
          ref={modalRef}
          role="dialog"
          aria-label="Map style selector"
          className="absolute top-16 right-0 max-h-[calc(100vh-200px)] overflow-y-auto bg-card rounded-xl shadow-2xl p-6 w-[340px] z-[2000] border border-border"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Map Style</h3>
            </div>
            <Button variant="ghost" size="icon" aria-label="Close map style selector" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-accent">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <RadioGroup
            value={selectedStyle}
            onValueChange={(value) => setSelectedStyle(value)}
            aria-label="Map style"
            className="grid grid-cols-2 gap-4 py-2"
          >
            {MAP_STYLE_OPTIONS.map((style) => (
              <RadioGroupItem key={style.id} value={style.id}>
                <div className="relative h-24 w-full bg-muted rounded-t-lg overflow-hidden">
                  <Image src={style.previewUrl || "/placeholder.svg"} alt={style.label} fill className="object-cover" />
                </div>
                <div className="p-3 text-center">
                  <div className="text-sm font-semibold text-foreground">{style.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{style.description}</div>
                </div>
              </RadioGroupItem>
            ))}
          </RadioGroup>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleCancel} className="hover:bg-accent bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleApply} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Apply Style
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
