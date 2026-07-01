import axios from "axios"

// Remove the incorrect import and add the utility function directly
const removeTrailingSlash = (url: string): string => {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

const BASE_URL = "/api/airqo"
// Axios instance with a base URL and default headers
const apiService = axios.create({
  baseURL: removeTrailingSlash(BASE_URL),
  headers: {
    "Content-Type": "application/json",
  },
})

// Interface for health tip
interface HealthTip {
  title?: string
  description?: string
  image?: string
}

// Interface for measurement value
interface MeasurementValue {
  value: number | null
}

// Interface for site details
interface SiteDetails {
  _id: string
  name: string
  formatted_name?: string
  approximate_latitude?: number
  approximate_longitude?: number
  country?: string
  location_name?: string
  city?: string
  region?: string
  data_provider?: string
}

// Interface for map node measurement
interface MapNode {
  _id: string
  site_id: string
  time: string
  aqi_category?: string
  aqi_color?: string
  aqi_color_name?: string
  device: string
  device_id: string
  pm2_5: MeasurementValue
  pm10: MeasurementValue
  no2: Partial<MeasurementValue>
  health_tips: HealthTip[]
  siteDetails: SiteDetails
  createdAt: string
  updatedAt: string
}

// Interface for heatmap data
interface HeatmapData {
  bounds: [[number, number], [number, number]]
  city: string
  id: string
  image: string // base64 encoded image
  message: string
}

export interface ActiveFire {
  acquisition_date?: string | null
  acquisition_datetime?: string | null
  acquisition_time?: string | null
  bright_t31?: number | null
  brightness?: number | null
  confidence?: string | number | null
  daynight?: string | null
  frp?: number | null
  instrument?: string | null
  latitude: number
  longitude: number
  product?: string | null
  satellite?: string | null
  scan?: number | null
  track?: number | null
  version?: string | null
}

export interface DailyForecastValues {
  pm2_5_mean: number | null
  pm2_5_low: number | null
  pm2_5_high: number | null
  pm2_5_min: number | null
  pm2_5_max: number | null
  forecast_confidence: number | null
}

export interface DailyForecastAqi {
  aqi_value: number | null
  label?: string
  aqi_category?: string
  aqi_color?: string
  aqi_color_name?: string
}

export interface DailyForecastMet {
  air_temperature: number | null
  relative_humidity: number | null
  air_pressure_at_sea_level: number | null
  precipitation_amount: number | null
  cloud_area_fraction: number | null
  wind_speed: number | null
  wind_from_direction: number | null
  wind_direction_compass?: string
}

export interface DailyForecastEntry {
  date: string
  created_at?: string
  forecast: DailyForecastValues
  aqi: DailyForecastAqi
  met: DailyForecastMet | null
}

export interface DailyForecastSiteDetails {
  site_id: string
  site_name: string
  site_latitude: number
  site_longitude: number
}

export interface DailyForecastSite {
  site_details: DailyForecastSiteDetails
  start_date: string
  end_date: string
  days: number
  total: number
  forecasts: DailyForecastEntry[]
}

export interface DailyForecastResponse {
  start_date: string
  end_date: string
  days: number
  total: number
  units?: Record<string, string>
  descriptions?: Record<string, string>
  forecasts: DailyForecastSite[]
}

export interface HourlyForecastValues {
  pm2_5_mean: number | null
  pm2_5_q10: number | null
  pm2_5_q90: number | null
  forecast_confidence: number | null
}

export interface HourlyForecastEntry {
  timestamp: string
  created_at?: string
  forecast: HourlyForecastValues
  aqi: DailyForecastAqi
  met: DailyForecastMet | null
}

export interface HourlyForecastSite {
  site_details: DailyForecastSiteDetails
  start_timestamp: string
  end_timestamp: string
  hours: number
  total: number
  forecasts: HourlyForecastEntry[]
}

export interface HourlyForecastResponse {
  start_timestamp: string
  end_timestamp: string
  hours: number
  page?: number
  limit?: number
  total_pages?: number
  total: number
  units?: Record<string, string>
  descriptions?: Record<string, string>
  forecasts: HourlyForecastSite[]
}

interface SiteHistoricalItem {
  time?: string
  timestamp?: string
  datetime?: string
  pm2_5?: MeasurementValue | number | null
  pm2_5_calibrated_value?: number | null
  pm2_5_raw_value?: number | null
}

// Satellite API service to fetch data with POST request
export const getSatelliteData = async (body = {}) => {
  try {
    const response = await apiService.post("/spatial/satellite_prediction", body)
    return response.data
  } catch (error: any) {
    console.error(error)
  }
}

// Get map nodes with air quality readings
export const getMapNodes = async (): Promise<MapNode[] | null> => {
  try {
    const response = await apiService.get("/devices/readings/map")

    // Only check if measurements array exists and has data
    if (!response.data?.measurements?.length) {
      console.error("No measurements found in response")
      return null
    }

    return response.data.measurements
  } catch (error) {
    console.error("Error fetching map nodes:", error)
    return null
  }
}

// Add this function to fetch report data
export const getReportData = async (): Promise<MapNode[] | null> => {
  try {
    const response = await apiService.get("/devices/readings/map")

    // Only check if measurements array exists and has data
    if (!response.data?.measurements?.length) {
      console.error("No measurements found in response")
      return null
    }

    return response.data.measurements
  } catch (error) {
    console.error("Error fetching report data:", error)
    return null
  }
}

let heatmapDataRequest: Promise<HeatmapData[] | null> | null = null
let heatmapRetryBlockedUntil = 0

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Get heatmap data from the spatial heatmaps endpoint with a hard retry cap.
export const getHeatmapData = async (): Promise<HeatmapData[] | null> => {
  if (Date.now() < heatmapRetryBlockedUntil) return null
  if (heatmapDataRequest) return heatmapDataRequest

  heatmapDataRequest = (async () => {
    const maxAttempts = 3
    const retryDelayMs = 1000

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await apiService.get("/spatial/heatmaps")

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data
        }

        console.warn(`Heatmap attempt ${attempt}/${maxAttempts}: no heatmap data returned.`)
      } catch (error) {
        console.error(`Heatmap attempt ${attempt}/${maxAttempts} failed:`, error)
      }

      if (attempt < maxAttempts) {
        await delay(retryDelayMs * attempt)
      }
    }

    heatmapRetryBlockedUntil = Date.now() + 5 * 60 * 1000
    console.error("Heatmap fetch failed after 3 attempts. Skipping retries for 5 minutes.")
    return null
  })()

  try {
    return await heatmapDataRequest
  } finally {
    heatmapDataRequest = null
  }
}

const getActiveFireTimestamp = (fire: ActiveFire) => {
  const directTimestamp = fire.acquisition_datetime ? Date.parse(fire.acquisition_datetime) : Number.NaN
  if (Number.isFinite(directTimestamp)) return directTimestamp

  const time = fire.acquisition_time?.padStart(4, "0")
  if (!fire.acquisition_date || !time) return null

  const fallbackTimestamp = Date.parse(
    `${fire.acquisition_date}T${time.slice(0, 2)}:${time.slice(2, 4)}:00Z`,
  )
  return Number.isFinite(fallbackTimestamp) ? fallbackTimestamp : null
}

const getActiveFireDeduplicationKey = (fire: ActiveFire) => {
  const latitudeBucket = fire.latitude.toFixed(2)
  const longitudeBucket = fire.longitude.toFixed(2)
  const timestamp = getActiveFireTimestamp(fire)
  const tenMinuteBucket = timestamp == null ? "unknown" : Math.floor(timestamp / 600_000)

  return `${latitudeBucket}:${longitudeBucket}:${tenMinuteBucket}`
}

const deduplicateActiveFires = (fires: ActiveFire[]) => {
  const uniqueFires = new Map<string, ActiveFire>()

  fires.forEach((fire) => {
    const key = getActiveFireDeduplicationKey(fire)
    const existing = uniqueFires.get(key)

    if (!existing || (fire.frp ?? 0) > (existing.frp ?? 0)) {
      uniqueFires.set(key, fire)
    }
  })

  return Array.from(uniqueFires.values())
}

export const getActiveFires = async (): Promise<ActiveFire[] | null> => {
  try {
    const response = await apiService.get("/spatial/active_fires/africa", {
      params: { hours: 24 },
    })
    const fires = response.data?.data?.fires

    if (!Array.isArray(fires)) {
      console.warn("Active-fire response did not include a fires array.")
      return []
    }

    const validFires = fires
      .filter(
        (fire): fire is ActiveFire =>
          fire &&
          typeof fire.latitude === "number" &&
          Number.isFinite(fire.latitude) &&
          typeof fire.longitude === "number" &&
          Number.isFinite(fire.longitude),
      )
      .map((fire) => ({ ...fire, product: fire.product || "NASA FIRMS" }))

    return deduplicateActiveFires(validFires)
  } catch (error) {
    console.error("Active-fire request failed:", error)
    return null
  }
}

const unwrapForecastPayload = (value: any): any => {
  let current = value

  for (let i = 0; i < 6; i++) {
    if (Array.isArray(current) && current.length === 1) {
      current = current[0]
      continue
    }
    break
  }

  return current
}

export const getDailyForecastCollection = async (): Promise<DailyForecastResponse | null> => {
  try {
    const response = await apiService.get("/predict/daily-forecasting")

    const payload = unwrapForecastPayload(response.data)
    const data = payload?.data ? unwrapForecastPayload(payload.data) : payload

    if (data && typeof data === "object" && Array.isArray((data as DailyForecastResponse).forecasts)) {
      return data as DailyForecastResponse
    }

    return null
  } catch (error) {
    console.error("Error fetching daily forecast collection:", error)
    return null
  }
}

export const getDailyForecast = async (siteId: string): Promise<DailyForecastSite | null> => {
  try {
    const collection = await getDailyForecastCollection()
    if (!collection?.forecasts?.length) return null
    return collection.forecasts.find((site) => site.site_details?.site_id === siteId) || null
  } catch (error) {
    console.error("Error fetching site daily forecast:", error)
    return null
  }
}

const getHourlyForecastPage = async (
  siteId: string | null,
  page: number,
  limit: number,
  hours: number,
): Promise<HourlyForecastResponse | null> => {
  const response = await apiService.get("/predict/hourly-forecasting", {
    params: {
      ...(siteId ? { site_id: siteId } : {}),
      page,
      limit,
      hours,
    },
  })

  const payload = unwrapForecastPayload(response.data)
  const data = payload?.data ? unwrapForecastPayload(payload.data) : payload

  if (data && typeof data === "object" && Array.isArray((data as HourlyForecastResponse).forecasts)) {
    return data as HourlyForecastResponse
  }

  return null
}

const mergeHourlyForecastCollectionPages = (pages: HourlyForecastResponse[]): HourlyForecastResponse | null => {
  if (!pages.length) return null

  const firstPage = pages[0]
  const siteById = new Map<string, HourlyForecastSite>()
  const forecastMapsBySiteId = new Map<string, Map<string, HourlyForecastEntry>>()

  pages.forEach((page) => {
    page.forecasts?.forEach((site) => {
      const siteId = site.site_details?.site_id
      if (!siteId) return

      if (!siteById.has(siteId)) {
        siteById.set(siteId, site)
        forecastMapsBySiteId.set(siteId, new Map<string, HourlyForecastEntry>())
      }

      const forecastMap = forecastMapsBySiteId.get(siteId)
      site.forecasts?.forEach((forecast) => {
        if (forecast?.timestamp) {
          forecastMap?.set(forecast.timestamp, forecast)
        }
      })
    })
  })

  const forecasts = Array.from(siteById.entries()).map(([siteId, site]) => {
    const siteForecasts = Array.from(forecastMapsBySiteId.get(siteId)?.values() || []).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    return {
      ...site,
      start_timestamp: siteForecasts[0]?.timestamp || site.start_timestamp,
      end_timestamp: siteForecasts[siteForecasts.length - 1]?.timestamp || site.end_timestamp,
      forecasts: siteForecasts,
    }
  })

  return {
    ...firstPage,
    forecasts,
  }
}

export const getHourlyForecastCollection = async (hours = 168, pageSize = 10): Promise<HourlyForecastResponse | null> => {
  try {
    const firstPage = await getHourlyForecastPage(null, 1, pageSize, hours)
    if (!firstPage) return null

    const totalPages = Math.max(1, firstPage.total_pages || 1)
    const remainingPages =
      totalPages > 1
        ? await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) => getHourlyForecastPage(null, index + 2, pageSize, hours)),
          )
        : []

    const pages = [firstPage, ...remainingPages.filter((page): page is HourlyForecastResponse => !!page)]
    const collection = mergeHourlyForecastCollectionPages(pages)

    if (!collection?.forecasts?.length) return null

    return {
      ...collection,
      forecasts: collection.forecasts.map((site) => ({
        ...site,
        forecasts: site.forecasts.slice(0, hours),
      })),
    }
  } catch (error) {
    console.error("Error fetching hourly forecast collection:", error)
    return null
  }
}

const mergeHourlyForecastPages = (siteId: string, pages: HourlyForecastResponse[]): HourlyForecastSite | null => {
  const returnedSites = pages.flatMap((page) => page.forecasts || [])
  const matchingSites = returnedSites.filter((site) => site.site_details?.site_id === siteId)
  const sites = matchingSites.length > 0 ? matchingSites : returnedSites.length === 1 ? returnedSites : []

  const returnedSites = pages.flatMap((page) => page.forecasts || []).filter((site) => site.forecasts?.length)
  const returnedSiteIds = new Set(returnedSites.map((site) => site.site_details?.site_id).filter(Boolean))
  const scopedFallbackSites =
    sites.length > 0 ? sites : returnedSites.length > 0 && returnedSiteIds.size <= 1 ? returnedSites : []

  if (!scopedFallbackSites.length) return null

  const firstSite = scopedFallbackSites[0]
  const forecastByTimestamp = new Map<string, HourlyForecastEntry>()

  scopedFallbackSites.forEach((site) => {
    site.forecasts?.forEach((forecast) => {
      if (forecast?.timestamp) {
        forecastByTimestamp.set(forecast.timestamp, forecast)
      }
    })
  })

  const forecasts = Array.from(forecastByTimestamp.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )

  return {
    ...firstSite,
    start_timestamp: forecasts[0]?.timestamp || firstSite.start_timestamp,
    end_timestamp: forecasts[forecasts.length - 1]?.timestamp || firstSite.end_timestamp,
    hours: pages[0]?.hours ?? firstSite.hours,
    total: pages[0]?.total ?? firstSite.total,
    forecasts,
  }
}

const hourlyForecastSiteRequests = new Map<string, Promise<HourlyForecastSite | null>>()

export const getHourlyForecast = async (siteId: string, hours = 168, pageSize = 100): Promise<HourlyForecastSite | null> => {
  const requestKey = `${siteId}:${hours}:${pageSize}`
  const existingRequest = hourlyForecastSiteRequests.get(requestKey)
  if (existingRequest) return existingRequest

  const request = (async () => {
    try {
      const firstPage = await getHourlyForecastPage(siteId, 1, pageSize, hours)
      if (!firstPage) return null

      const pages = [firstPage]
      const totalPages = Math.max(1, firstPage.total_pages || 1)

      // Avoid sending a burst of parallel requests if one site still spans multiple pages.
      for (let page = 2; page <= totalPages; page += 1) {
        const nextPage = await getHourlyForecastPage(siteId, page, pageSize, hours)
        if (nextPage) pages.push(nextPage)
      }

      const mergedSite = mergeHourlyForecastPages(siteId, pages)

      if (mergedSite?.forecasts?.length) {
        return {
          ...mergedSite,
          forecasts: mergedSite.forecasts.slice(0, hours),
        }
      }

      return null
    } catch (error) {
      console.error("Error fetching site hourly forecast:", error)
      return null
    } finally {
      hourlyForecastSiteRequests.delete(requestKey)
    }
  })()

  hourlyForecastSiteRequests.set(requestKey, request)
  return request
}

export const getSiteHistorical = async (
  siteId: string,
  startTime: string = "LAST7DAYS",
  endTime: string = "TODAY",
): Promise<SiteHistoricalItem[] | null> => {
  try {
    const extractMeasurements = (value: any): SiteHistoricalItem[] | null => {
      const isMeasurementRow = (row: any) =>
        row &&
        typeof row === "object" &&
        (typeof row.time === "string" || typeof row.timestamp === "string" || typeof row.datetime === "string") &&
        ("pm2_5" in row || "pm2_5_calibrated_value" in row || "pm2_5_raw_value" in row)

      const unwrapSingles = (v: any) => {
        let current = v
        // Some endpoints wrap response as `[[[{...}]]]` etc.
        for (let i = 0; i < 6; i++) {
          if (Array.isArray(current) && current.length === 1) {
            current = current[0]
            continue
          }
          break
        }
        return current
      }

      const v = unwrapSingles(value)

      if (Array.isArray(v)) {
        // Case A: array of measurement rows
        if (v.length && isMeasurementRow(v[0])) return v as SiteHistoricalItem[]

        // Case B: array of wrapper objects each with measurements
        const collected: SiteHistoricalItem[] = []
        v.forEach((item) => {
          const unwrappedItem = unwrapSingles(item)
          if (unwrappedItem && typeof unwrappedItem === "object" && Array.isArray((unwrappedItem as any).measurements)) {
            collected.push(...((unwrappedItem as any).measurements as SiteHistoricalItem[]))
            return
          }
          if (unwrappedItem && typeof unwrappedItem === "object" && Array.isArray((unwrappedItem as any).data)) {
            collected.push(...((unwrappedItem as any).data as SiteHistoricalItem[]))
            return
          }
          if (unwrappedItem && typeof unwrappedItem === "object" && Array.isArray((unwrappedItem as any).results)) {
            collected.push(...((unwrappedItem as any).results as SiteHistoricalItem[]))
            return
          }
        })
        return collected.length ? collected : null
      }

      if (v && typeof v === "object") {
        if (Array.isArray((v as any).measurements)) return (v as any).measurements as SiteHistoricalItem[]
        if (Array.isArray((v as any).data)) return (v as any).data as SiteHistoricalItem[]
        if (Array.isArray((v as any).results)) return (v as any).results as SiteHistoricalItem[]
      }

      return null
    }

    const fetchHistorical = async (s: string, e: string) => {
      const response = await apiService.get(`/devices/measurements/sites/${siteId}/historical`, {
        params: {
          startTime: s,
          endTime: e,
        },
      })
      return extractMeasurements(response.data)
    }

    // Prefer explicit ISO times (some deployments don't accept LAST7DAYS/TODAY reliably).
    const isoResult = await fetchHistorical(startTime, endTime)
    if (isoResult?.length) return isoResult

    // Fallback to keyword params if the caller passed ISO (or vice versa).
    const keywordResult = await fetchHistorical("LAST7DAYS", "TODAY")
    if (keywordResult?.length) return keywordResult

    return isoResult || keywordResult || null
  } catch (error) {
    console.error("Error fetching site historical:", error)
    return null
  }
}
