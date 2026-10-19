export type Reading = { site_id?: string; time?: string; pm2_5?: { value: number | null }; siteDetails?: { _id?: string; name?: string; description?: string }; aqi_category?: string }
export type Period = { date?: string; timestamp?: string; forecast: { pm2_5_mean: number | null }; aqi?: { aqi_category?: string; label?: string }; met?: { air_temperature?: number | null; precipitation_amount?: number | null; wind_speed?: number | null; wind_direction_compass?: string; relative_humidity?: number | null } | null }
export type ForecastSite = { site_details: { site_id: string; site_name: string }; forecasts: Period[] }
export type BillboardData = { measurements: Reading[]; daily: ForecastSite[]; hourly: ForecastSite[]; warnings: string[] }
export const BILLBOARD_REFRESH_MS = 60 * 60 * 1000
export function activityForAir(value: number | null | undefined, preferred = "running") {
  if (value == null || !Number.isFinite(value) || value < 0) return "unavailable"
  if (value <= 9.1) return preferred === "football" ? "football" : preferred === "yoga" ? "yoga" : "running"
  if (value <= 35.49) return "walking"
  if (value <= 55.49) return "yoga"
  if (value <= 125.49) return "reading"
  if (value <= 225.49) return "resting"
  return "window"
}
export function categoryImage(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || value < 0) return null
  const file = value <= 9.1 ? "GoodAir" : value <= 35.49 ? "Moderate" : value <= 55.49 ? "UnhealthySG" : value <= 125.49 ? "Unhealthy" : value <= 225.49 ? "VeryUnhealthy" : "Hazardous"
  return `/images/${file}.png`
}
export function category(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || value < 0) return { label: "Unavailable", color: "#64748b", action: "Check back for a recent reading.", indoors: true }
  if (value <= 9.1) return { label: "Good", color: "#15803d", action: "Enjoy your usual outdoor activities.", indoors: false }
  if (value <= 35.49) return { label: "Moderate", color: "#a16207", action: "If you are sensitive to air pollution, consider reducing prolonged outdoor exertion.", indoors: false }
  if (value <= 55.49) return { label: "Unhealthy for sensitive groups", color: "#c2410c", action: "Sensitive groups should reduce prolonged or heavy outdoor exertion.", indoors: true }
  if (value <= 125.49) return { label: "Unhealthy", color: "#dc2626", action: "Reduce prolonged or heavy outdoor exertion. Choose a cleaner indoor space when possible.", indoors: true }
  return { label: value <= 225.49 ? "Very unhealthy" : "Hazardous", color: "#7e225c", action: "Avoid outdoor exertion and seek a cleaner indoor space. Follow local health advice.", indoors: true }
}
export function latestReadings(rows: Reading[]) {
  const sites = new Map<string, Reading>()
  for (const row of rows) {
    const id = row.site_id || row.siteDetails?._id
    if (!id || !row.time || !Number.isFinite(Date.parse(row.time))) continue
    const old = sites.get(id)
    if (!old || Date.parse(row.time) > Date.parse(old.time!)) sites.set(id, row)
  }
  return sites
}
