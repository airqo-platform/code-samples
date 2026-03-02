"use client"

import { Suspense, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Papa from "papaparse"
import { useMap, useMapEvents } from "react-leaflet"
import { AlertTriangle, ChevronDown, Download, Info, Loader2, Satellite, X } from "lucide-react"

import { FileUpload } from "@/components/Controls/FileUpload"
import Navigation from "@/components/navigation/navigation"
import { getSiteCategory } from "@/lib/api"
import type {
  Location,
  SourceCandidate,
  SourceMetadataDateRange,
  SourceMetadataResponse,
  SourceMetadataSiteCategory,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card"
import { Label } from "@/ui/label"
import { Switch } from "@/ui/switch"
import { Textarea } from "@/ui/textarea"
import { useToast } from "@/ui/use-toast"
import "leaflet/dist/leaflet.css"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })

interface SiteCategoryInfo extends Location {
  area_name: string | null
  category: string | null
  candidate_sources: SourceCandidate[]
  computed_at_utc: string | null
  data_sources: string[]
  date_range: SourceMetadataDateRange | null
  disclaimer: string | null 
  model_version: string | null
  osm_debug_info: string[]
  primary_confidence: number | null
  primary_source: string | null
  satellite_enabled: boolean
  satellite_error: string | null
  satellite_pollutants_mean: Record<string, number | null>
  satellite_reasoning: string[]
  site_category: SourceMetadataSiteCategory | null
  site_reasoning: string[]
}

const sourceLabel = (value: string | null | undefined) =>
  value
    ? value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Unknown"

const confidenceLabel = (value: number | null | undefined) =>
  value == null ? "N/A" : `${(value * 100).toFixed(1)}%`

const displayValue = (value: string | number | null | undefined) => (value == null || value === "" ? "N/A" : String(value))

const timeLabel = (value: string | null | undefined) => {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const siteKey = (site: Pick<SiteCategoryInfo, "lat" | "lng" | "satellite_enabled">) =>
  `${site.lat}-${site.lng}-${site.satellite_enabled ? "sat" : "nosat"}`

const toSiteInfo = (response: SourceMetadataResponse, lat: number, lng: number, satelliteEnabled: boolean): SiteCategoryInfo => {
  const details = response.data.evidence.site_category
  const primary = response.data.primary_source ?? response.data.candidate_sources[0] ?? null

  return {
    lat,
    lng,
    area_name: details?.area_name ?? null,
    category: details?.category ?? null,
    candidate_sources: response.data.candidate_sources ?? [],
    computed_at_utc: response.data.metadata?.computed_at_utc ?? null,
    data_sources: response.data.metadata?.data_sources ?? [],
    date_range: response.data.metadata?.date_range ?? null,
    disclaimer: response.data.metadata?.disclaimer ?? null, 
    model_version: response.data.metadata?.model_version ?? null,
    osm_debug_info: response.data.evidence.osm_debug_info ?? [],
    primary_confidence: primary?.confidence ?? null,
    primary_source: primary?.source_type ?? null,
    satellite_enabled: satelliteEnabled,
    satellite_error: response.data.evidence.satellite_error ?? null,
    satellite_pollutants_mean: response.data.evidence.satellite_pollutants_mean ?? {},
    satellite_reasoning: response.data.evidence.satellite_reasoning ?? [],
    site_category: details ?? null,
    site_reasoning: response.data.evidence.site_reasoning ?? [],
  }
}

function SiteCategoryContent() {
  const [sites, setSites] = useState<SiteCategoryInfo[]>([])
  const [selectedSite, setSelectedSite] = useState<SiteCategoryInfo | null>(null)
  const [manualInput, setManualInput] = useState("")
  const [includeSatellite, setIncludeSatellite] = useState(true)
  const [isManualSectionOpen, setIsManualSectionOpen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([1.3733, 32.2903])
  const { toast } = useToast()

  const exists = (lat: number, lng: number, satelliteEnabled: boolean) =>
    sites.some((site) => site.lat === lat && site.lng === lng && site.satellite_enabled === satelliteEnabled)

  const fetchSite = async (lat: number, lng: number, satelliteEnabled: boolean) =>
    toSiteInfo(await getSiteCategory(lat, lng, satelliteEnabled), lat, lng, satelliteEnabled)

  const processLocations = async (locations: Location[]) => {
    const satelliteEnabled = includeSatellite
    const newSites: SiteCategoryInfo[] = []
    const seenKeys = new Set(
      sites
        .filter((site) => site.satellite_enabled === satelliteEnabled)
        .map((site) => siteKey(site)),
    )
    let failed = 0
    let skipped = 0

    setLoading(true)
    try {
      for (const location of locations) {
        const locationKey = siteKey({ ...location, satellite_enabled: satelliteEnabled })

        if (seenKeys.has(locationKey)) {
          skipped += 1
          continue
        }

        seenKeys.add(locationKey)

        try {
          newSites.push(await fetchSite(location.lat, location.lng, satelliteEnabled))
        } catch (error) {
          failed += 1
          console.error(error)
        }
      }

      if (newSites.length > 0) {
        setSites((prev) => [...prev, ...newSites])
        setSelectedSite(newSites[newSites.length - 1])
        setMapCenter([newSites[newSites.length - 1].lat, newSites[newSites.length - 1].lng])
        toast({
          title: "Source metadata ready",
          description: `Processed ${newSites.length} location(s) with satellite ${satelliteEnabled ? "on" : "off"}${skipped ? `, skipped ${skipped}` : ""}${failed ? `, ${failed} failed` : ""}.`,
        })
      } else if (failed > 0) {
        toast({ title: "Error", description: "Failed to process the requested locations.", variant: "destructive" })
      } else if (skipped > 0) {
        toast({ title: "No new locations", description: "These coordinates already exist for the current satellite mode." })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMapClick = async (e: { latlng: { lat: number; lng: number } }) => {
    const { lat, lng } = e.latlng
    const satelliteEnabled = includeSatellite

    if (exists(lat, lng, satelliteEnabled)) {
      const match = sites.find((site) => site.lat === lat && site.lng === lng && site.satellite_enabled === satelliteEnabled)
      if (match) {
        setSelectedSite(match)
        setMapCenter([lat, lng])
      }
      return
    }

    setLoading(true)
    try {
      const nextSite = await fetchSite(lat, lng, satelliteEnabled)
      setSites((prev) => [...prev, nextSite])
      setSelectedSite(nextSite)
      setMapCenter([lat, lng])
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to load source metadata.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = async () => {
    try {
      const coordinates = manualInput
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [lat, lng] = line.split(",").map((value) => Number.parseFloat(value.trim()))
          if (Number.isNaN(lat) || Number.isNaN(lng)) throw new Error("Use one latitude,longitude pair per line.")
          return { lat, lng }
        })

      await processLocations(coordinates)
      setManualInput("")
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Invalid coordinates format.", variant: "destructive" })
    }
  }

  const downloadCSV = () => {
    const pollutantKeys = Array.from(new Set(sites.flatMap((site) => Object.keys(site.satellite_pollutants_mean)))).sort()
    const rows = sites.map((site) => {
      const row: Record<string, string | number> = {
        latitude: site.lat,
        longitude: site.lng,
        satellite_enabled: site.satellite_enabled ? "true" : "false",
        primary_source: sourceLabel(site.primary_source),
        primary_confidence: site.primary_confidence == null ? "" : Number((site.primary_confidence * 100).toFixed(1)),
        site_category: site.category ?? "",
        area_name: site.area_name ?? "",
        candidate_sources: site.candidate_sources.map((item) => `${sourceLabel(item.source_type)} (${confidenceLabel(item.confidence)})`).join(" | "),
        site_reasoning: site.site_reasoning.join(" | "),
        satellite_reasoning: site.satellite_reasoning.join(" | "),
        satellite_error: site.satellite_error ?? "",
        osm_debug_info: site.osm_debug_info.join(" | "),
        data_sources: site.data_sources.join(" | "),
        computed_at_utc: site.computed_at_utc ?? "",
        start_date: site.date_range?.start_date ?? "",
        end_date: site.date_range?.end_date ?? "",
        model_version: site.model_version ?? "",
        disclaimer: site.disclaimer ?? "",
      }

      for (const key of pollutantKeys) row[`satellite_${key.toLowerCase()}`] = site.satellite_pollutants_mean[key] ?? ""
      return row
    })

    const blob = new Blob([Papa.unparse(rows)], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "source_metadata.csv"
    link.click()
  }

  const MapEvents = () => {
    useMapEvents({ click: handleMapClick })
    return null
  }

  const MapController = ({ center }: { center: [number, number] }) => {
    const map = useMap()
    useEffect(() => {
      map.flyTo(center, Math.max(map.getZoom(), 3), { duration: 0.75 })
    }, [center, map])
    return null
  }

  const selectedKey = selectedSite ? siteKey(selectedSite) : null
  const pollutantEntries = selectedSite ? Object.entries(selectedSite.satellite_pollutants_mean) : []

  return (
    <div className="min-h-screen bg-slate-50">
      <Suspense fallback={<div>Loading navigation...</div>}><Navigation /></Suspense>
      <div className="pt-16">
        <div className="flex h-[calc(100vh-4rem)]">
          <div className="relative flex-1">
            <MapContainer center={mapCenter} zoom={7} className="h-full w-full">
              <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapEvents />
              <MapController center={mapCenter} />
              {sites.map((site) => (
                <Marker key={siteKey(site)} position={[site.lat, site.lng]} eventHandlers={{ click: () => { setSelectedSite(site); setMapCenter([site.lat, site.lng]) } }}>
                  <Popup>
                    <div className="space-y-1 p-1 text-sm">
                      <p><strong>Primary Source:</strong> {sourceLabel(site.primary_source)}</p>
                      <p><strong>Confidence:</strong> {confidenceLabel(site.primary_confidence)}</p>
                      <p><strong>Site Category:</strong> {displayValue(site.category)}</p>
                      <p><strong>Satellite:</strong> {site.satellite_enabled ? "On" : "Off"}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <Button onClick={() => setShowInfo(true)} className="absolute left-4 top-4 z-[1000] rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600">
              <Info className="h-5 w-5" />
            </Button>
          </div>
          <div className="w-[28rem] shrink-0 space-y-4 overflow-y-auto border-l border-slate-200 bg-white p-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg">Request Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-xl border bg-slate-50 p-3">
                  <div>
                    <Label htmlFor="satellite-toggle" className="font-semibold">Include Satellite Data</Label>
                    <p className="text-xs text-slate-500">New lookups use satellite data by default.</p>
                  </div>
                  <Switch id="satellite-toggle" checked={includeSatellite} onCheckedChange={setIncludeSatellite} />
                </div>
                <Button onClick={downloadCSV} disabled={sites.length === 0} className="w-full bg-blue-500 text-white hover:bg-blue-600"><Download className="mr-2 h-4 w-4" />Download CSV</Button>
                <FileUpload onUpload={processLocations} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <button
                  type="button"
                  onClick={() => setIsManualSectionOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <CardTitle className="text-lg">Add Multiple Locations</CardTitle>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-slate-500 transition-transform",
                      isManualSectionOpen ? "rotate-180" : "rotate-0",
                    )}
                  />
                </button>
              </CardHeader>
              {isManualSectionOpen && (
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-500">Enter one `latitude,longitude` pair per line.</p>
                  <Textarea value={manualInput} onChange={(e) => setManualInput(e.target.value)} placeholder="0.3178311,32.5899529&#10;0.318058,32.590206" className="min-h-28" />
                  <Button onClick={handleManualSubmit} disabled={!manualInput.trim() || loading} className="w-full bg-blue-500 text-white hover:bg-blue-600">Process Coordinates</Button>
                </CardContent>
              )}
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg">Results</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {sites.length === 0 ? <p className="text-sm text-slate-500">Click the map, upload a CSV, or paste coordinates to fetch source metadata.</p> : sites.slice().reverse().map((site) => (
                  <button key={siteKey(site)} type="button" onClick={() => { setSelectedSite(site); setMapCenter([site.lat, site.lng]) }} className={cn("w-full rounded-xl border p-3 text-left transition", selectedKey === siteKey(site) ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-200 hover:bg-slate-50")}>
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-semibold text-slate-900">{sourceLabel(site.primary_source)}</p><p className="text-sm text-slate-500">{displayValue(site.area_name)}</p></div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Sat {site.satellite_enabled ? "On" : "Off"}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{site.lat.toFixed(5)}, {site.lng.toFixed(5)}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
            {selectedSite && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-lg">Source Metadata</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-sm text-slate-500">Primary Source</p><h2 className="text-xl font-bold text-slate-900">{sourceLabel(selectedSite.primary_source)}</h2></div>
                      <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">{confidenceLabel(selectedSite.primary_confidence)}</div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <p><strong>Category:</strong> {displayValue(selectedSite.category)}</p>
                      <p><strong>Satellite:</strong> {selectedSite.satellite_enabled ? "On" : "Off"}</p>
                      <p className="col-span-2"><strong>Area:</strong> {displayValue(selectedSite.area_name)}</p>
                      <p><strong>Latitude:</strong> {selectedSite.lat.toFixed(6)}</p>
                      <p><strong>Longitude:</strong> {selectedSite.lng.toFixed(6)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">Candidate Sources</h3>
                    {selectedSite.candidate_sources.length === 0 ? <p className="text-sm text-slate-500">No candidate source ranking returned.</p> : selectedSite.candidate_sources.map((item) => (
                      <div key={`${item.source_type}-${item.confidence}`} className="rounded-xl border p-3">
                        <div className="mb-2 flex items-center justify-between"><span className="font-medium text-slate-900">{sourceLabel(item.source_type)}</span><span className="text-sm font-semibold text-slate-600">{confidenceLabel(item.confidence)}</span></div>
                        <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.max(item.confidence * 100, 4)}%` }} /></div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border p-3"><p className="text-slate-500">Highway</p><p className="font-medium">{displayValue(selectedSite.site_category?.highway)}</p></div>
                    <div className="rounded-xl border p-3"><p className="text-slate-500">Land Use</p><p className="font-medium">{displayValue(selectedSite.site_category?.landuse)}</p></div>
                    <div className="rounded-xl border p-3"><p className="text-slate-500">Natural</p><p className="font-medium">{displayValue(selectedSite.site_category?.natural)}</p></div>
                    <div className="rounded-xl border p-3"><p className="text-slate-500">Waterway</p><p className="font-medium">{displayValue(selectedSite.site_category?.waterway)}</p></div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border p-3"><p className="mb-2 text-sm font-semibold text-slate-900">Site Reasoning</p>{selectedSite.site_reasoning.length ? selectedSite.site_reasoning.map((item) => <p key={item} className="text-sm text-slate-600">{item}</p>) : <p className="text-sm text-slate-500">No site-only reasoning was returned.</p>}</div>
                    <div className="rounded-xl border p-3"><div className="mb-2 flex items-center gap-2"><Satellite className="h-4 w-4 text-blue-500" /><p className="text-sm font-semibold text-slate-900">Satellite Reasoning</p></div>{selectedSite.satellite_enabled ? (selectedSite.satellite_reasoning.length ? selectedSite.satellite_reasoning.map((item) => <p key={item} className="text-sm text-slate-600">{item}</p>) : <p className="text-sm text-slate-500">No satellite reasoning was returned.</p>) : <p className="text-sm text-slate-500">Satellite data was disabled for this request.</p>}</div>
                    {selectedSite.satellite_error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><div className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />Satellite Error</div><p>{selectedSite.satellite_error}</p></div>}
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">Satellite Pollutants Mean</h3>
                    {selectedSite.satellite_enabled && pollutantEntries.length ? <div className="grid grid-cols-2 gap-3">{pollutantEntries.map(([key, value]) => <div key={key} className="rounded-xl border p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key}</p><p className="mt-1 text-sm font-medium text-slate-900">{value == null ? "N/A" : value.toFixed(6)}</p></div>)}</div> : <p className="text-sm text-slate-500">{selectedSite.satellite_enabled ? "No pollutant averages were returned." : "Satellite pollutant averages are unavailable because satellite data was disabled."}</p>}
                  </div>
                  <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
                    <p><strong>Computed At:</strong> {timeLabel(selectedSite.computed_at_utc)}</p>
                    <p><strong>Date Range:</strong> {selectedSite.date_range ? `${selectedSite.date_range.start_date} to ${selectedSite.date_range.end_date}` : "N/A"}</p>
                    <p><strong>Data Sources:</strong> {selectedSite.data_sources.length ? selectedSite.data_sources.join(", ") : "N/A"}</p>
                    <p><strong>Model Version:</strong> {displayValue(selectedSite.model_version)}</p> 
                    <p><strong>Disclaimer:</strong> {displayValue(selectedSite.disclaimer)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="relative w-full max-w-lg bg-white">
            <CardHeader className="pr-12"><CardTitle className="text-xl">How Categorize Works</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <Button variant="ghost" className="absolute right-2 top-2 text-slate-500 hover:text-slate-700" onClick={() => setShowInfo(false)}><X className="h-5 w-5" /></Button>
              <p>The page now calls `spatial/source_metadata` and returns inferred primary source, candidate sources, site context, satellite diagnostics, and metadata for each coordinate.</p>
              <p>`Include Satellite Data` is on by default. Keep it on to combine site context with Sentinel-5P signals, or turn it off to inspect site-based reasoning only.</p>
              <p>Click the map, upload a CSV with latitude and longitude columns, or paste coordinates manually. Results are stored separately for satellite on and off requests.</p>
            </CardContent>
          </Card>
        </div>
      )}
      {loading && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="flex items-center space-x-2 rounded-lg bg-white p-4"><Loader2 className="h-4 w-4 animate-spin" /><span className="font-bold text-slate-700">Processing source metadata...</span></div></div>}
    </div>
  )
}

export default function SiteCategory() {
  return (
    <Suspense fallback={<div>Loading source metadata...</div>}>
      <SiteCategoryContent />
    </Suspense>
  )
}
