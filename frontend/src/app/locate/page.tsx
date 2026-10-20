"use client"
import { useState } from "react"
import { ControlPanel } from "@/components/controls/control-panel"
import type { Location, SiteLocatorPayload } from "@/lib/types"
import { submitLocations } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  MapPin,
  MousePointer2,
  RotateCcw,
  Route,
  X,
} from "lucide-react"
import html2canvas from "html2canvas"
import Navigation from "@/components/navigation/navigation"
import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("@/components/mapping/map-component"), {
  ssr: false,
})

export default function Index() {
  const [polygon, setPolygon] = useState<Location[]>([])
  const [mustHaveLocations, setMustHaveLocations] = useState<Location[]>([])
  const [suggestedLocations, setSuggestedLocations] = useState<Location[]>([])
  const { toast } = useToast()
  const [isDrawing, setIsDrawing] = useState(false)
  const [isSelectingPriority, setIsSelectingPriority] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showResultsNotice, setShowResultsNotice] = useState(false)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)

  const handleSubmit = async (payload: SiteLocatorPayload) => {
    try {
      const response = await submitLocations(payload)
      if (!response.site_location || !Array.isArray(response.site_location)) {
        throw new Error("Invalid response format from API")
      }
      const locations = response.site_location.map((site) => ({
        lat: site.latitude,
        lng: site.longitude,
      }))
      setSuggestedLocations(locations)
      setShowResultsNotice(locations.length > 0)
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
    setMustHaveLocations((current) => {
      const duplicate = current.some(
        (item) => Math.abs(item.lat - location.lat) < 0.000001 && Math.abs(item.lng - location.lng) < 0.000001,
      )
      return duplicate ? current : [...current, location]
    })
    toast({
      title: "Priority location added",
      description: `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
    })
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
    setIsSelectingPriority(false)
    setIsDrawing(!isDrawing)
  }

  const handleReset = () => {
    setPolygon([])
    setMustHaveLocations([])
    setSuggestedLocations([])
    setIsDrawing(false)
    setIsSelectingPriority(false)
    setShowResultsNotice(false)
    toast({
      title: "Workspace cleared",
      description: "The boundary, priority locations, and recommendations were removed.",
    })
  }

  const boundaryReady = polygon.length >= 3
  const hasResults = suggestedLocations.length > 0

  return (
    <div className="flex min-h-screen flex-col bg-muted/40 lg:h-[100svh]">
      <Navigation />

      <main id="main-content" tabIndex={-1} className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="z-10 flex flex-col border-b border-border bg-card shadow-sm lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="border-b border-border px-5 py-5">
            <div className={`flex items-center justify-between gap-3 ${isHeaderCollapsed ? "" : "mb-2"}`}>
              <h1 className="text-xl font-medium tracking-tight text-foreground">Locate monitoring sites</h1>
              <div className="flex items-center gap-1">
                {!isHeaderCollapsed ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowInfo(true)}
                    aria-label="Open site locator guide"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsHeaderCollapsed((current) => !current)}
                  aria-label={isHeaderCollapsed ? "Expand site locator summary" : "Collapse site locator summary"}
                >
                  {isHeaderCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {!isHeaderCollapsed ? (
              <>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Define a service area, protect priority locations, and generate a field-ready sensor deployment plan.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-md border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Boundary</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{boundaryReady ? "Ready" : "Required"}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{mustHaveLocations.length}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Suggested</p>
                    <p className="mt-1 text-sm font-medium text-primary">{suggestedLocations.length}</p>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <ControlPanel
              onSubmit={handleSubmit}
              polygon={polygon}
              mustHaveLocations={mustHaveLocations}
              onMustHaveLocationsChange={setMustHaveLocations}
              onBoundaryFound={setPolygon}
              isSelectingPriority={isSelectingPriority}
              onSelectingPriorityChange={(isSelecting) => {
                setIsDrawing(false)
                setIsSelectingPriority(isSelecting)
              }}
            />
          </div>

          <div className="border-t border-border bg-muted p-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleExportCSV}
                disabled={!hasResults && mustHaveLocations.length === 0}
                aria-label="Export locations to CSV"
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={handleSaveMap}
                aria-label="Save map as image"
                variant="outline"
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                Save map
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={handleReset}
              className="mt-3 w-full gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear workspace
            </Button>
          </div>
        </aside>

        <section className="relative min-h-[560px] overflow-hidden bg-muted">
          <MapComponent
            polygon={polygon}
            mustHaveLocations={mustHaveLocations}
            suggestedLocations={suggestedLocations}
            onPolygonChange={setPolygon}
            onLocationClick={handleLocationClick}
            isDrawing={isDrawing}
            isSelectingPriority={isSelectingPriority}
          />

          <div className="pointer-events-none absolute left-16 right-4 top-4 z-[1000] flex items-start justify-between gap-3 sm:left-20">
            <div className="pointer-events-auto max-w-lg rounded-md border border-border bg-card/95 p-3 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className={`rounded-md p-2 ${isDrawing ? "bg-amber-50 text-amber-700" : "bg-muted text-primary"}`}>
                  {isDrawing || isSelectingPriority ? <MousePointer2 className="h-5 w-5" /> : <Route className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isDrawing
                      ? "Click the map to trace your boundary"
                      : isSelectingPriority
                        ? "Click the map to add priority locations"
                        : boundaryReady
                          ? "Boundary ready for analysis"
                          : "Choose or draw a boundary"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isDrawing
                      ? `${polygon.length} points added. Use at least three points.`
                      : isSelectingPriority
                        ? `${mustHaveLocations.length} priority locations added`
                      : boundaryReady
                        ? `${polygon.length} boundary points selected`
                        : "Search for an area in the panel or start drawing."}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant={isDrawing ? "secondary" : "default"}
              onClick={toggleDrawing}
              aria-label={isDrawing ? "Finish drawing polygon" : "Start drawing polygon"}
              className="pointer-events-auto gap-2 px-4"
            >
              {isDrawing ? <CheckCircle2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              {isDrawing ? "Finish boundary" : "Draw boundary"}
            </Button>
          </div>

          <div className="absolute bottom-5 left-5 z-[1000] rounded-md border border-border bg-card/95 p-3 shadow-sm backdrop-blur">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Map legend</p>
            <div className="space-y-2 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-success ring-2 ring-background shadow" />
                Priority location
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-primary ring-2 ring-background shadow" />
                Recommended site
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm border-2 border-primary bg-accent/70" />
                Analysis boundary
              </div>
            </div>
          </div>

          {hasResults && showResultsNotice ? (
            <div className="absolute bottom-5 right-5 z-[1000] max-w-xs rounded-md border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Info className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">Deployment plan ready</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {suggestedLocations.length} recommended sites are available for review and export.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowResultsNotice(false)}
                  aria-label="Dismiss deployment plan notification"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </main>

      {showInfo ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-md bg-muted p-2 text-primary">
                  <Info className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-medium text-foreground">How to build a deployment plan</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInfo(false)}
                aria-label="Close site locator guide"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                ["1", "Set the boundary", "Search for an administrative area or draw a custom polygon on the map."],
                ["2", "Add priorities", "Search, click the map, enter coordinates, or upload locations that must be included in the final network."],
                ["3", "Define spacing", "Choose the number of sensors and minimum distance between recommended sites."],
                ["4", "Generate and export", "Review the suggested sites, then save the map or download the coordinates."],
              ].map(([step, title, description]) => (
                <div key={step} className="flex gap-3 rounded-md border border-border p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-medium text-primary">
                    {step}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
