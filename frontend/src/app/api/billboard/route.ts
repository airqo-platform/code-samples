import { NextRequest } from "next/server"
import type { ForecastSite, Reading } from "@/lib/billboard"
import { latestReadings } from "@/lib/billboard"
import { AIRQO_API_URL, unwrapForecastPayload } from "@/lib/airqo-api-config"
import { getCachedGridResponse } from "@/lib/airqo-grid-cache"

export async function GET(request: NextRequest) {
  const grid = request.nextUrl.searchParams.get("grid_id")
  const cohort = request.nextUrl.searchParams.get("cohort_id")
  const id = grid || cohort
  const hourlyOnly = request.nextUrl.searchParams.get("hourly") === "1"
  const siteId = request.nextUrl.searchParams.get("site_id")
  if (!id || Boolean(grid) === Boolean(cohort) || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return Response.json({ message: "Choose one valid grid or cohort ID." }, { status: 400 })
  if (hourlyOnly && (!siteId || !/^[A-Za-z0-9_-]{1,128}$/.test(siteId))) return Response.json({ message: "Choose a monitoring location for the hourly forecast." }, { status: 400 })
  const token = process.env.API_TOKEN
  if (!token) return Response.json({ message: "The server needs an AirQo API token to load this billboard." }, { status: 503 })
  async function get(path: string, query: Record<string, string>) {
    const url = new URL(path, AIRQO_API_URL)
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v))
    const response = await getCachedGridResponse(url.toString())
    const body = unwrapForecastPayload(JSON.parse(response.body))
    if (body.success === false) throw new Error("AirQo data unavailable")
    return { ...body, ...(body.data ? unwrapForecastPayload(body.data) : {}) }
  }
  const scope: Record<string, string> = grid ? { grid_id: id } : { cohort_id: id }
  async function measurements(): Promise<Reading[]> {
    const rows: Reading[] = []
    for (let page = 0; page < 100; page++) {
      const data = await get(`devices/measurements/${grid ? "grids" : "cohorts"}/${id}`, { limit: "80", skip: String(page * 80) })
      const batch = data.measurements || []
      rows.push(...batch)
      if (batch.length < 80 || (data.meta?.total != null && rows.length >= data.meta.total)) return rows
    }
    throw new Error("Measurement result too large")
  }
  async function forecasts(kind: string): Promise<ForecastSite[]> {
    const rows: ForecastSite[] = []
    for (let page = 1; page <= 100; page++) {
      const data = await get(`predict/${kind}-forecasting`, { ...scope, limit: "100", page: String(page), ...(kind === "hourly" ? { hours: "168" } : {}) })
      for (const site of data.forecasts || []) {
        if (!site.site_details?.site_id || (hourlyOnly && site.site_details.site_id !== siteId)) continue
        const startHour = Math.floor(Date.now() / 3600000) * 3600000
        const periods = (site.forecasts || []).filter((p: ForecastSite["forecasts"][number]) => kind !== "hourly" || (p.timestamp && Date.parse(p.timestamp) >= startHour))
        rows.push({ site_details: { site_id: site.site_details.site_id, site_name: site.site_details.site_name }, forecasts: periods.slice(0, kind === "hourly" ? 24 : 7).map((p: ForecastSite["forecasts"][number]) => ({
          ...(p.date ? { date: p.date } : {}), ...(p.timestamp ? { timestamp: p.timestamp } : {}),
          forecast: { pm2_5_mean: p.forecast?.pm2_5_mean ?? null },
          aqi: { aqi_category: p.aqi?.aqi_category, label: p.aqi?.label },
          met: p.met ? { air_temperature: p.met.air_temperature, precipitation_amount: p.met.precipitation_amount, wind_speed: p.met.wind_speed, wind_direction_compass: p.met.wind_direction_compass, relative_humidity: p.met.relative_humidity } : null,
        })) })
      }
      if (page >= (data.total_pages || 1)) return rows
    }
    throw new Error("Forecast result too large")
  }
  // Hourly forecasts are fetched only after an explicit viewer request.
  if (hourlyOnly) {
    try { return Response.json({ hourly: await forecasts("hourly") }, { headers: { "Cache-Control": "no-store" } }) }
    catch { return Response.json({ message: "Hourly forecast unavailable. Try again later." }, { status: 502 }) }
  }
  const results = await Promise.allSettled([measurements(), forecasts("daily")])
  const warnings = results.flatMap((r, i) => r.status === "rejected" ? [i === 0 ? "Current readings could not be loaded." : `${i === 1 ? "Daily" : "Hourly"} forecasts unavailable. Forecasts require Premium access.`] : [])
  const compactReadings = results[0].status === "fulfilled" ? Array.from(latestReadings(results[0].value), ([site_id, r]) => ({ site_id, time: r.time, pm2_5: { value: r.pm2_5?.value ?? null }, siteDetails: { name: r.siteDetails?.description || r.siteDetails?.name } })) : []
  const body = JSON.stringify({ measurements: compactReadings, daily: results[1].status === "fulfilled" ? results[1].value : [], hourly: [], warnings })
  // Reserve room for the page shell and assets within the 2 MB display budget.
  if (new TextEncoder().encode(body).byteLength > 1000000) return Response.json({ message: "This network is too large for the lightweight billboard. Choose a smaller grid or cohort." }, { status: 413 })
  return new Response(body, { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } })
}
