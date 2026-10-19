import type { NextRequest } from "next/server"
import { wrapLongitude, type WindBounds } from "@/lib/wind-field"
import type { TemperatureField } from "@/lib/temperature-field"

const COLUMNS = 13
const ROWS = 9
const HOURS = 24
const TTL = 15 * 60 * 1000
const cache = new Map<string, { expires: number; field: TemperatureField }>()
const pending = new Map<string, Promise<TemperatureField>>()
let providerCooldownUntil = 0

class ProviderRateLimitError extends Error {}

async function loadField(bounds: WindBounds): Promise<TemperatureField> {
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
    hourly: "temperature_2m", forecast_hours: String(HOURS), temperature_unit: "celsius",
    timeformat: "unixtime", cell_selection: "nearest", timezone: "GMT",
    ...(apiKey ? { apikey: apiKey } : {}),
  }).toString()
  const response = await fetch(url, { signal: AbortSignal.timeout(25_000), cache: "no-store" })
  if (response.status === 429) {
    const seconds = Number(response.headers.get("retry-after"))
    const details = await response.json().catch(() => null)
    const reason = typeof details?.reason === "string" ? details.reason.toLowerCase() : ""
    const period = reason.includes("daily") ? 24 * 60 * 60 * 1000 : reason.includes("hourly") ? 60 * 60 * 1000 : 60 * 1000
    providerCooldownUntil = Number.isFinite(seconds) && seconds > 0
      ? Date.now() + Math.min(seconds, 86400) * 1000
      : (Math.floor(Date.now() / period) + 1) * period + 1000
    throw new ProviderRateLimitError()
  }
  if (!response.ok) throw new Error("Temperature provider unavailable")
  const data = await response.json()
  if (!Array.isArray(data) || data.length !== ROWS * COLUMNS) throw new Error("Incomplete temperature grid")
  const times = data[0]?.hourly?.time
  if (!Array.isArray(times) || times.length !== HOURS || times.some((time, i) =>
    typeof time !== "number" || !Number.isFinite(time) || (i > 0 && time - times[i - 1] !== 3600)) ||
    Math.abs(Date.now() - times[0] * 1000) > 2 * 60 * 60 * 1000) throw new Error("Invalid forecast times")
  const temperatures = times.map((time, hour) => data.map((entry) => {
    if (entry?.hourly?.time?.[hour] !== time || entry?.hourly_units?.temperature_2m !== "°C") return null
    const value = entry.hourly.temperature_2m?.[hour]
    return typeof value === "number" && Number.isFinite(value) && value >= -100 && value <= 70 ? value : null
  }))
  if (!temperatures.some((grid) => grid.some((value) => value !== null))) throw new Error("No temperature data")
  return { ...bounds, columns: COLUMNS, rows: ROWS, temperatures, times: times.map((time) => new Date(time * 1000).toISOString()) }
}

export async function GET(request: NextRequest) {
  const values = ["west", "east", "south", "north"].map((key) => {
    const value = request.nextUrl.searchParams.get(key)
    return value?.trim() ? Number(value) : NaN
  })
  const [west, east, south, north] = values
  if (values.some((value) => !Number.isFinite(value)) || west < -180 || west >= 180 ||
    east <= west || east - west > 360 || south < -85 || north > 85 || north <= south) {
    return Response.json({ message: "Invalid temperature map bounds." }, { status: 400 })
  }
  const key = values.join(":")
  try {
    const cached = cache.get(key)
    let field = cached && cached.expires > Date.now() ? cached.field : null
    if (!field) {
      if (Date.now() < providerCooldownUntil) throw new ProviderRateLimitError()
      let loading = pending.get(key)
      if (!loading) {
        if (pending.size >= 4) return Response.json({ message: "Temperature service is busy. Please retry." }, { status: 503 })
        loading = loadField({ west, east, south, north }).then((result) => {
          if (cache.size >= 32) cache.delete(cache.keys().next().value!)
          cache.set(key, { expires: Date.now() + TTL, field: result })
          return result
        }).finally(() => pending.delete(key))
        pending.set(key, loading)
      }
      field = await loading
    }
    return Response.json(field, { headers: { "Cache-Control": "public, max-age=300" } })
  } catch (error) {
    if (error instanceof ProviderRateLimitError) {
      return Response.json({ message: "Weather provider request limit reached. Please try again shortly." }, {
        status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((providerCooldownUntil - Date.now()) / 1000))) },
      })
    }
    return Response.json({ message: "Temperature data is temporarily unavailable. Please retry." }, { status: 502 })
  }
}
