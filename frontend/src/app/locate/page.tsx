"use client"
import { useState } from "react"
import { ControlPanel } from "@/components/Controls/ControlPanel"
import type { Location, SiteLocatorPayload } from "@/lib/types"
import { submitLocations } from "@/lib/api"
import { useToast } from "@/ui/use-toast"
import { Button } from "@/ui/button"
import { Download, Camera, Info, X } from "lucide-react"
import html2canvas from "html2canvas"
import Navigation from "@/components/navigation/navigation"
import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("@/components/map/MapComponent"), {
  ssr: false,
})

export default function Index() {
  const [polygon, setPolygon] = useState<Location[]>([])
  const [mustHaveLocations, setMustHaveLocations] = useState<Location[]>([])
  const [suggestedLocations, setSuggestedLocations] = useState<Location[]>([])
  const { toast } = useToast()
  const [isDrawing, setIsDrawing] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const handleSubmit = async (payload: SiteLocatorPayload) => {
    try {
      console.log("Submitting payload:", payload)
      const response = await submitLocations(payload)
      console.log("API Response:", response)
      if (!response.site_location || !Array.isArray(response.site_location)) {
        throw new Error("Invalid response format from API")
      }
      const locations = response.site_location.map((site) => ({
        lat: site.latitude,
        lng: site.longitude,
      }))
      console.log("Processed locations to plot:", locations)
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
    if (suggestedLocations.length === 0 && mustHaveLocations.length === 0) {
      toast({
        title: "No Data",
        description: "No locations available to export",
        variant: "destructive",
      })
      return
    }
    const headers = ["Type", "Latitude", "Longitude"]
    const uniqueLocations = new Set()
    const formatRow = (type: string, loc: Location) => `${type},${loc.lat},${loc.lng},,`

    const rows = mustHaveLocations.map((loc) => {
      const key = `${loc.lat},${loc.lng}`
      uniqueLocations.add(key)
      return formatRow("Must Have", loc)
    })

    suggestedLocations.forEach((loc) => {
      const key = `${loc.lat},${loc.lng}`
      if (!uniqueLocations.has(key)) {
        uniqueLocations.add(key)
        rows.push(formatRow("Suggested", loc))
      }
    })

    const csvContent = [headers.join(","), ...rows].join("\n")
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
      {/* Navigation */}
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

        {/* Control Panel Top Right */}
        <div className="absolute right-4 top-4 z-[1000]">
          <ControlPanel
            onSubmit={handleSubmit}
            polygon={polygon}
            mustHaveLocations={mustHaveLocations}
            onMustHaveLocationsChange={setMustHaveLocations}
            onBoundaryFound={setPolygon}
          />

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            <Button
              onClick={handleExportCSV}
              aria-label="Export locations to CSV"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <Download className="h-4 w-4" />
              Save CSV
            </Button>
            <Button
              onClick={handleSaveMap}
              aria-label="Save map as image"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              <Camera className="h-4 w-4" />
              Save Map
            </Button>
            <Button
              onClick={toggleDrawing}
              aria-label={isDrawing ? "Finish drawing polygon" : "Start drawing polygon"}
              className={`${
                isDrawing ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
              } flex items-center gap-2 text-white px-4 py-2 rounded-lg`}
            >
              {isDrawing ? "Finish Drawing" : "Draw Polygon"}
            </Button>
          </div>
        </div>

        {/* Info Button and Popup */}
        <div className="absolute left-2 top-[180px] z-[1000] flex flex-col items-center space-y-2">
          
          <Button
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-full"
            aria-label="Show Locate tool info"
          >
            <Info className="h-4 w-4" />
          </Button>

          {showInfo && (
            <div className="mt-2 max-w-sm p-4 bg-white border border-gray-300 shadow-lg rounded-lg text-sm text-gray-800">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold mb-2">Locate Tool</h3>
                <Button
                  onClick={() => setShowInfo(false)}
                  aria-label="Close info popup"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="mb-2">
                The Locate tool is used to propose the best possible locations for placing air quality monitors,
                based on the number of sensors and the target geographical area.
              </p>
              <ul className="list-disc list-inside">
                <li>You can search by name or draw a polygon.</li>
                <li>Must-have locations are optional and can be uploaded by lat/lng.</li>
                <li>Minimum distance is optional; default is 0.5 km.</li>
                <li>Number of sensors is required.</li>
                <li>You can submit multiple times until satisfied with the results.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
