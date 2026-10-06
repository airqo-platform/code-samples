"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useState } from "react"
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet"
import type { LatLngTuple } from "leaflet"

type Reading = { position: LatLngTuple; name: string; pm25: number | null; date: string | null }
type RawMeasurement = {
  siteDetails?: Site; site_details?: Site; latitude?: unknown; longitude?: unknown;
  pm2_5?: { value?: unknown } | number; pm25?: unknown; date?: string
}
type Site = { approximate_latitude?: unknown; approximate_longitude?: unknown; latitude?: unknown;
  longitude?: unknown; description?: string; site_name?: string; name?: string }

function number(value: unknown): number | null {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null
  const result = Number(value)
  return Number.isFinite(result) ? result : null
}

const bands = [
  { max: 12, color: "#10b981", label: "Good" },
  { max: 35.4, color: "#eab308", label: "Moderate" },
  { max: 55.4, color: "#f97316", label: "Unhealthy for sensitive groups" },
  { max: 150.4, color: "#ef4444", label: "Unhealthy" },
  { max: 250.4, color: "#a855f7", label: "Very unhealthy" },
  { max: Infinity, color: "#881337", label: "Hazardous" },
]

function FitGrid({ readings }: { readings: Reading[] }) {
  const map = useMap()
  useEffect(() => {
    if (readings.length) map.fitBounds(readings.map(r => r.position), { padding: [35, 35], maxZoom: 14 })
  }, [map, readings])
  return null
}

export default function GridMap({ gridId }: { gridId: string }) {
  const [readings, setReadings] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError("")
    async function load() {
      try {
        const response = await fetch(`/api/airqo/devices/measurements/grids/${encodeURIComponent(gridId)}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(response.status === 404 ? "This grid was not found." : "Unable to load air quality readings.")
        const payload = await response.json()
        if (!Array.isArray(payload.data)) throw new Error("AirQo returned an unexpected response.")
        const next: Reading[] = []
        for (const measurement of payload.data as RawMeasurement[]) {
          const site = measurement.siteDetails || measurement.site_details || {}
          const lat = number(site.approximate_latitude ?? site.latitude ?? measurement.latitude)
          const lon = number(site.approximate_longitude ?? site.longitude ?? measurement.longitude)
          if (lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue
          const pm25 = number(typeof measurement.pm2_5 === "object" ? measurement.pm2_5?.value : measurement.pm2_5 ?? measurement.pm25)
          next.push({ position: [lat, lon], name: site.description || site.site_name || site.name || "Monitoring site",
            pm25: pm25 !== null && pm25 >= 0 ? pm25 : null, date: measurement.date || null })
        }
        setReadings(next)
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load readings.")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [gridId, attempt])

  return <main className="flex h-[100dvh] min-h-[250px] flex-col bg-white text-slate-900" style={{ colorScheme: "light" }}>
    <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
      <h1 className="font-semibold">Air quality map <span className="text-sm font-normal text-slate-500">· PM2.5</span></h1>
      <a href="https://airqo.net" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700">Powered by AirQo</a>
    </header>
    <div className="relative min-h-0 flex-1">
      <MapContainer center={[1.5, 17.5]} zoom={4} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitGrid readings={readings} />
        {readings.map((reading, index) => {
          const band = reading.pm25 === null ? { color: "#64748b", label: "No reading" } : bands.find(b => reading.pm25! <= b.max)!
          return <CircleMarker key={index} center={reading.position} radius={10} pathOptions={{ color: band.color, fillColor: band.color, fillOpacity: 0.85 }}>
            <Popup><strong>{reading.name}</strong><br />
              PM2.5: {reading.pm25 === null ? "Unavailable" : `${reading.pm25.toFixed(1)} µg/m³`}<br />{band.label}
              {reading.date && <><br /><time>{reading.date}</time></>}
            </Popup>
          </CircleMarker>
        })}
      </MapContainer>
      {(loading || error || !readings.length) && <div role={error ? "alert" : "status"} className="absolute left-1/2 top-4 z-[1000] w-[min(85%,380px)] -translate-x-1/2 rounded-lg bg-white p-4 text-center shadow">
        {loading ? "Loading grid readings…" : error || "No monitoring sites with coordinates are available for this grid."}
        {error && <button className="ml-2 text-blue-700 underline" onClick={() => setAttempt(a => a + 1)}>Retry</button>}
      </div>}
    </div>
    <footer className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2 text-xs" aria-label="PM2.5 concentration categories">
      {bands.map(band => <span key={band.label} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: band.color }} />{band.label}</span>)}
      <span>Concentration in µg/m³</span>
    </footer>
  </main>
}
