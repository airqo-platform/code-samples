import type { NextRequest } from "next/server"
import { windVector, wrapLongitude, type WindField, type WindBounds } from "@/lib/wind-field"

const COLUMNS = 13
const ROWS = 9
const TTL = 15 * 60 * 1000
const cache = new Map<string, { expires: number; field: WindField }>()
const pending = new Map<string, Promise<WindField>>()

async function loadField(bounds: WindBounds): Promise<WindField> {
  const latitudes: string[] = []
  const longitudes: string[] = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      latitudes.push((bounds.south + (bounds.north - bounds.south) * row / (ROWS - 1)).toFixed(4))
      longitudes.push(wrapLongitude(bounds.west + (bounds.east - bounds.west) * col / (COLUMNS - 1)).toFixed(4))
    }
  }
  const apiKey = process.env.OPEN_METEO_API_KEY
  const url = new URL(`https://${apiKey ? "customer-api" : "api"}.open-meteo.com/v1/forecast`)
  url.search = new URLSearchParams({
    latitude: latitudes.join(","), longitude: longitudes.join(","),
    current: "wind_speed_10m,wind_direction_10m", wind_speed_unit: "ms",
    timeformat: "unixtime", cell_selection: "nearest", models: "gfs_seamless",
    ...(apiKey ? { apikey: apiKey } : {}),
  }).toString()
  const response = await fetch(url, { signal: AbortSignal.timeout(25_000), cache: "no-store" })
  if (!response.ok) throw new Error("Wind provider unavailable")
  const data = await response.json()
  if (!Array.isArray(data) || data.length !== ROWS * COLUMNS) throw new Error("Incomplete wind grid")
  const time = data[0]?.current?.time
  if (typeof time !== "number" || !Number.isFinite(time) || Math.abs(Date.now() - time * 1000) > 2 * 60 * 60 * 1000) {
    throw new Error("Wind forecast is out of date")
  }
  const vectors = data.map((entry) => {
    if (entry?.current?.time !== time || entry?.current_units?.wind_speed_10m !== "m/s") return null
    return windVector(entry.current.wind_speed_10m, entry.current.wind_direction_10m)
  })
  if (!vectors.some(Boolean)) throw new Error("No wind data")
  return { ...bounds, columns: COLUMNS, rows: ROWS, vectors, time: new Date(time * 1000).toISOString() }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const values = ["west", "east", "south", "north"].map((key) => {
    const value = params.get(key)
    return value?.trim() ? Number(value) : NaN
  })
  const [west, east, south, north] = values
  if (values.some((value) => !Number.isFinite(value)) || west < -180 || west >= 180 ||
    east <= west || east - west > 360 || south < -85 || north > 85 || north <= south) {
    return Response.json({ message: "Invalid wind map bounds." }, { status: 400 })
  }
  const bounds = { west, east, south, north }
  const key = values.join(":")
  try {
    const cached = cache.get(key)
    let field = cached && cached.expires > Date.now() ? cached.field : null
    if (!field) {
      let request = pending.get(key)
      if (!request) {
        // Bound concurrent upstream work as well as memory use.
        if (pending.size >= 4) return Response.json({ message: "Wind service is busy. Please retry." }, { status: 503 })
        request = loadField(bounds).then((result) => {
          if (cache.size >= 32) cache.delete(cache.keys().next().value!)
          cache.set(key, { expires: Date.now() + TTL, field: result })
          return result
        }).finally(() => pending.delete(key))
        pending.set(key, request)
      }
      field = await request
    }
    return Response.json(field, { headers: { "Cache-Control": "public, max-age=300" } })
  } catch {
    return Response.json({ message: "Wind data is temporarily unavailable. Please retry." }, { status: 502 })
  }
}
