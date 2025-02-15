"use client" // Add this at the top of the file

import { useState } from "react"
import { MapComponent } from "@/components/map/MapComponent"
import { ControlPanel } from "@/components/Controls/ControlPanel"
import type { Location, SiteLocatorPayload } from "@/lib/types"
import { submitLocations } from "@/lib/api"
import { useToast } from "@/ui/use-toast"
import { Button } from "@/ui/button"
import { Download, Camera } from "lucide-react"
import html2canvas from "html2canvas"
import Navigation from "@/components/navigation/navigation"

export default function Index() {
  const [polygon, setPolygon] = useState<Location[]>([])
  const [mustHaveLocations, setMustHaveLocations] = useState<Location[]>([])
  const [suggestedLocations, setSuggestedLocations] = useState<Location[]>([])
  const { toast } = useToast()
  const [isDrawing, setIsDrawing] = useState(false)

  const handleSubmit = async (payload: SiteLocatorPayload) => {
    try {
      console.log("Submitting payload:", payload) // Debug log for request
      const response = await submitLocations(payload)
      console.log("API Response:", response) // Debug log for response

      if (!response.site_location || !Array.isArray(response.site_location)) {
        throw new Error("Invalid response format from API")
      }

      const locations = response.site_location.map((site) => ({
        lat: site.latitude,
        lng: site.longitude,
      }))

      console.log("Processed locations to plot:", locations) // Debug log for processed locations
      setSuggestedLocations(locations)

      toast({
        title: "Success",
        description: `Found ${locations.length} suggested locations`,
      })
    } catch (error) {
      console.error("Submit error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit locations",
        variant: "destructive",
      })
    }
  }

  const handleLocationClick = (location: Location) => {
    setMustHaveLocations([...mustHaveLocations, location])
  }

  const handleExportCSV = () => {
    if (suggestedLocations.length === 0) {
      toast({
        title: "No Data",
        description: "No locations available to export",
        variant: "destructive",
      })
      return
    }

    const headers = ["Type", "Latitude", "Longitude", "Area Name", "Category"]
    const rows = [
      ...mustHaveLocations.map((loc) => ["Must Have", loc.lat, loc.lng, "", ""]),
      ...suggestedLocations.map((loc) => ["Suggested", loc.lat, loc.lng, "", ""]),
    ]

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "locations.csv"
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "CSV file downloaded successfully",
    })
  }

  const handleSaveMap = async () => {
    const mapElement = document.querySelector(".leaflet-container")
    if (mapElement) {
      const canvas = await html2canvas(mapElement as HTMLElement)
      const url = canvas.toDataURL("image/png")
      const a = document.createElement("a")
      a.href = url
      a.download = "map.png"
      a.click()

      toast({
        title: "Success",
        description: "Map image saved successfully",
      })
    }
  }

  const toggleDrawing = () => {
    setIsDrawing(!isDrawing)
  }

  return (
    <div className="flex flex-col h-screen">
      <Navigation />
      <div className="relative flex-1">
        <MapComponent
          polygon={polygon}
          mustHaveLocations={mustHaveLocations}
          suggestedLocations={suggestedLocations}
          onPolygonChange={setPolygon}
          onLocationClick={handleLocationClick}
          isDrawing={isDrawing}
        />

        {/* Control Panel */}
        <div className="absolute right-4 top-4 z-[1000]">
          <ControlPanel
            onSubmit={handleSubmit}
            polygon={polygon}
            mustHaveLocations={mustHaveLocations}
            onMustHaveLocationsChange={setMustHaveLocations}
            onBoundaryFound={setPolygon}
          />
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 z-[1000] flex gap-2">
          <Button onClick={handleExportCSV} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleSaveMap} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Camera className="h-4 w-4 mr-2" />
            Save Map
          </Button>
        </div>

        {/* Draw Polygon Button */}
        <div className="absolute bottom-4 right-1/2 transform translate-x-1/2 z-[1000]">
          <Button
            className={`${isDrawing ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}
            onClick={toggleDrawing}
          >
            {isDrawing ? "Finish Drawing" : "Draw Polygon"}
          </Button>
        </div>
      </div>
    </div>
  )
}

