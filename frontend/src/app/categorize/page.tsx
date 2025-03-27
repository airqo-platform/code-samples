"use client"

import { Suspense, useState } from "react"
import { Button } from "@/ui/button"
import { FileUpload } from "@/components/Controls/FileUpload"
import { useToast } from "@/ui/use-toast"
import dynamic from "next/dynamic"
import { useMapEvents } from "react-leaflet"

import { getSiteCategory } from "@/lib/api"
import type { Location } from "@/lib/types"
import { Card } from "@/ui/card"
import { Loader2 } from "lucide-react"
import Papa from "papaparse"
import Navigation from "@/components/navigation/navigation"
import { Textarea } from "@/ui/textarea"
import { Download } from "lucide-react"
import "leaflet/dist/leaflet.css"

// Dynamic imports for leaflet components to avoid SSR errors
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
// const useMapEvents = dynamic(
//   () => import("react-leaflet").then((mod) => mod.useMapEvents),
//   { ssr: false }
// );
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
})

interface SiteCategoryInfo extends Location {
  category?: string
  area_name?: string
}

function SiteCategoryContent() {
  const [sites, setSites] = useState<SiteCategoryInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSite, setSelectedSite] = useState<SiteCategoryInfo | null>(null)
  const [manualInput, setManualInput] = useState("")
  const { toast } = useToast()

  const fetchSiteCategory = async (lat: number, lng: number) => {
    try {
      setLoading(true)
      const response = await getSiteCategory(lat, lng)
      return {
        lat,
        lng,
        category: response.site["site-category"].category,
        area_name: response.site["site-category"].area_name,
      }
    } catch (error) {
      console.log(error)
      toast({
        title: "Error",
        description: "Failed to get site category",
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleMapClick = async (e: {
    latlng: { lat: number; lng: number }
  }) => {
    const { lat, lng } = e.latlng

    // Avoid duplicate requests for the same location
    if (sites.some((site) => site.lat === lat && site.lng === lng)) return

    const newSite = await fetchSiteCategory(lat, lng)
    if (newSite) {
      setSites((prevSites) => [...prevSites, newSite])
      setSelectedSite(newSite)
    }
  }
  const handleFileUpload = async (locations: Location[]) => {
    setLoading(true)
    const newSites: SiteCategoryInfo[] = []

    try {
      for (const location of locations) {
        const response = await getSiteCategory(location.lat, location.lng)
        newSites.push({
          ...location,
          category: response.site["site-category"].category,
          area_name: response.site["site-category"].area_name,
        })
      }

      setSites(newSites)
      toast({
        title: "Success",
        description: `Processed ${newSites.length} sites`,
      })
    } catch (error) {
      console.log(error)
      toast({
        title: "Error",
        description: "Failed to process sites",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  const handleManualSubmit = async () => {
    const coordinates = manualInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
      .map((line) => {
        const [lat, lng] = line.split(",").map((num) => Number.parseFloat(num.trim()))
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error("Invalid coordinates format")
        }
        return { lat, lng }
      })

    setLoading(true)
    const newSites: SiteCategoryInfo[] = []

    for (const coord of coordinates) {
      if (!sites.some((site) => site.lat === coord.lat && site.lng === coord.lng)) {
        const newSite = await fetchSiteCategory(coord.lat, coord.lng)
        if (newSite) newSites.push(newSite)
      }
    }

    if (newSites.length > 0) {
      setSites((prevSites) => [...prevSites, ...newSites])
      toast({
        title: "Success",
        description: `Processed ${newSites.length} sites`,
      })
    }

    setManualInput("")
    setLoading(false)
  }

  const MapEvents = () => {
    useMapEvents({
      click: handleMapClick,
    })
    return null
  }

  const downloadCSV = () => {
    const csv = Papa.unparse(sites)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "site_categories.csv"
    link.click()
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div>Loading navigation...</div>}>
        <Navigation />
      </Suspense>
      <div className="flex h-screen pt-16">
        <div className="flex-1">
          <MapContainer center={[1.3733, 32.2903]} zoom={7} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents />
            {sites.map((site, index) => (
              <Marker
                key={`${site.lat}-${site.lng}-${index}`}
                position={[site.lat, site.lng]}
                eventHandlers={{ click: () => setSelectedSite(site) }}
              >
                <Popup>
                  <div className="p-2">
                    <p>
                      <strong>Category:</strong> {site.category}
                    </p>
                    <p>
                      <strong>Area:</strong> {site.area_name}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="w-96 p-4 space-y-4">
          <div className="space-y-4 mb-6">
            {/* Updated button with blue background and download icon */}
            <Button
              onClick={downloadCSV}
              disabled={sites.length === 0}
              className="w-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center"
            >
              <Download className="mr-2" /> {/* Download icon */}
              Download CSV
            </Button>
            <FileUpload onUpload={handleFileUpload} />

            <Card className="p-4">
              <h3 className="font-medium mb-2">Add Multiple Locations</h3>
              <p className="text-sm text-gray-500 mb-2">
                Enter coordinates (one per line) in format: latitude,longitude
              </p>
              <Textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="0.3178311,32.5899529&#10;0.318058,32.590206"
                className="mb-2"
                rows={5}
              />
              {/* "Process Coordinates" button now has blue background */}
              <Button
                onClick={handleManualSubmit}
                className="w-full bg-blue-500 text-white hover:bg-blue-600"
                disabled={!manualInput.trim()}
              >
                Process Coordinates
              </Button>
            </Card>
          </div>

          {selectedSite && (
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Site Information</h2>
              <div>
                <p>
                  <strong>Category:</strong> {selectedSite.category}
                </p>
                <p>
                  <strong>Area Name:</strong> {selectedSite.area_name}
                </p>
                <p>
                  <strong>Latitude:</strong> {selectedSite.lat.toFixed(6)}
                </p>
                <p>
                  <strong>Longitude:</strong> {selectedSite.lng.toFixed(6)}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 pr-50 rounded-lg flex items-center space-x-2">
            <Loader2 className="fixed right-3 w-4 h-4 animate-spin" />
            <span className="font-bold font-xl text-white-700 fixed right-11">Processing...</span>
          </div>
        </div>
      )}
    </div>
  )
}
export default function SiteCategory() {
  return (
    <Suspense fallback={<div>Loading site category...</div>}>
      <SiteCategoryContent />
    </Suspense>
  )
}

