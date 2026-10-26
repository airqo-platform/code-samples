import { NextRequest } from "next/server"
import type { ForecastSite, Reading } from "@/lib/billboard"
import { latestReadings } from "@/lib/billboard"
import { AIRQO_API_URL, unwrapForecastPayload } from "@/lib/airqo-api-config"
import { getCachedGridResponse, UncachedGridResponse } from "@/lib/airqo-grid-cache"
import { delay, RETRYABLE_API_STATUSES } from "@/lib/api-shared"

export async function GET(request: NextRequest) {
  const grid = request.nextUrl.searchParams.get("grid_id")
  const cohort = request.nextUrl.searchParams.get("cohort_id")
  const id = grid || cohort
  if (!id || Boolean(grid) === Boolean(cohort) || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return Response.json({ message: "Choose one valid grid or cohort ID." }, { status: 400 })
  const token = process.env.API_TOKEN
  if (!token) return Response.json({ message: "The server needs an AirQo API token to load this billboard." }, { status: 503 })
  async function get(path: string, query: Record<string, string>) {
    const url = new URL(path, AIRQO_API_URL)
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v))
    let response
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await getCachedGridResponse(url.toString())
        break
      } catch (error) {
        const status = error instanceof UncachedGridResponse ? error.response.status : null
        if (attempt === 2 || (status !== null && !RETRYABLE_API_STATUSES.has(status))) throw error
        await delay(1000 * (attempt + 1))
      }
    }
    if (!response) throw new Error("AirQo data unavailable")
    const body = unwrapForecastPayload(JSON.parse(response.body))
    if (body.success === false) throw new Error("AirQo data unavailable")
    return { ...body, ...(body.data ? unwrapForecastPayload(body.data) : {}) }
  }
  const warnings: string[] = []
  function forecastWarning(error: unknown) {
    const status = error instanceof UncachedGridResponse ? error.response.status : null
    if (status === 401 || status === 403) return "Daily forecasts unavailable, refresh"
    return "Daily forecasts are temporarily unavailable. Please try again shortly."
  }
  async function mapReadingsForGrid(): Promise<Reading[]> {
    const siteIds = new Set<string>()
    let skip = 0
    for (let page = 0; page < 20; page++) {
      const data = await get("devices/grids/summary", { limit: "30", skip: String(skip) })
      const grids = data.grids || []
      const selected = grids.find((candidate: { _id?: string }) => candidate._id === id)
      if (selected) {
        for (const site of selected.sites || []) if (site._id) siteIds.add(site._id)
        break
      }
      const limit = Number(data.meta?.limit) > 0 ? Number(data.meta.limit) : 30
      skip += limit
      if (!grids.length || (data.meta?.total != null && skip >= Number(data.meta.total)) || grids.length < limit) break
    }
    if (!siteIds.size) return []
    const data = await get("devices/readings/map", {})
    return (data.measurements || []).filter((reading: Reading) => reading.site_id && siteIds.has(reading.site_id))
  }
  async function measurements(): Promise<Reading[]> {
    const rows: Reading[] = []
    for (let page = 0; page < 10; page++) {
      let data
      try {
        const path = "devices/measurements/" + (grid ? "grids" : "cohorts") + "/" + id
        data = await get(path, { limit: "80", skip: String(page * 80) })
      } catch (error) {
        if (rows.length) {
          warnings.push("Some current readings could not be loaded. Available locations are shown.")
          return rows
        }
        if (grid) {
          try {
            const fallback = await mapReadingsForGrid()
            if (fallback.length) return fallback
          } catch {}
        }
        throw error
      }
      const batch = data.measurements || []
      rows.push(...batch)
      if (batch.length < 80 || (data.meta?.total != null && rows.length >= data.meta.total)) return rows
    }
    return rows
  }
  async function forecasts(): Promise<ForecastSite[]> {
    const data = await get("predict/daily-forecasting", {})
    const rows: ForecastSite[] = []
    for (const site of data.forecasts || []) {
      if (!site.site_details?.site_id) continue
      rows.push({ site_details: { site_id: site.site_details.site_id, site_name: site.site_details.site_name, site_latitude: site.site_details.site_latitude, site_longitude: site.site_details.site_longitude }, forecasts: (site.forecasts || []).filter((p: ForecastSite["forecasts"][number]) => p.date).sort((a: ForecastSite["forecasts"][number], b: ForecastSite["forecasts"][number]) => a.date!.localeCompare(b.date!)).slice(0, 7).map((p: ForecastSite["forecasts"][number]) => ({
        ...(p.date ? { date: p.date } : {}), ...(p.timestamp ? { timestamp: p.timestamp } : {}),
        forecast: { pm2_5_mean: p.forecast?.pm2_5_mean ?? null },
        aqi: { aqi_category: p.aqi?.aqi_category, label: p.aqi?.label },
        met: p.met ? { air_temperature: p.met.air_temperature, precipitation_amount: p.met.precipitation_amount, wind_speed: p.met.wind_speed, wind_direction_compass: p.met.wind_direction_compass, relative_humidity: p.met.relative_humidity } : null,
      })) })
    }
    return rows
  }
  const results = await Promise.allSettled([measurements(), forecasts()])
  results.forEach((r, i) => {
    if (r.status === "rejected") warnings.push(i === 0 ? "Current readings could not be loaded." : forecastWarning(r.reason))
  })
  const compactReadings = results[0].status === "fulfilled" ? Array.from(latestReadings(results[0].value), ([site_id, r]) => ({ site_id, time: r.time, pm2_5: { value: r.pm2_5?.value ?? null }, siteDetails: { name: r.siteDetails?.description || r.siteDetails?.name, latitude: r.siteDetails?.approximate_latitude ?? r.siteDetails?.latitude, longitude: r.siteDetails?.approximate_longitude ?? r.siteDetails?.longitude } })) : []
  const measuredSiteIds = new Set(compactReadings.map(reading => reading.site_id))
  const daily = results[1].status === "fulfilled" ? results[1].value.filter(site => measuredSiteIds.has(site.site_details.site_id)) : []
  const body = JSON.stringify({ measurements: compactReadings, daily, warnings })
  // Reserve room for the page shell and assets within the 2 MB display budget.
  if (new TextEncoder().encode(body).byteLength > 1000000) return Response.json({ message: "This network is too large for the lightweight billboard. Choose a smaller grid or cohort." }, { status: 413 })
  return new Response(body, { headers: { "Content-Type": "application/json", "Cache-Control": warnings.length ? "no-store, max-age=0" : "public, s-maxage=300, stale-while-revalidate=3600" } })
}
