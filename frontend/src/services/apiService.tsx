import axios from "axios"

// Remove the incorrect import and add the utility function directly
const removeTrailingSlash = (url: string): string => {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

const apiToken = process.env.NEXT_PUBLIC_API_TOKEN
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""
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
  met: DailyForecastMet
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
  met: DailyForecastMet
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
    const response = await apiService.post("/spatial/satellite_prediction", body, {
      params: {
        token: apiToken,
      },
    })
    return response.data
  } catch (error: any) {
    console.error(error)
  }
}

// Get map nodes with air quality readings
export const getMapNodes = async (): Promise<MapNode[] | null> => {
  try {
    const response = await apiService.get("/devices/readings/map", {
      params: {
        token: apiToken,
      },
    })

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
    const response = await apiService.get("/devices/readings/map", {
      params: {
        token: apiToken,
      },
    })

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

// Get heatmap data from the spatial heatmaps endpoint with retry logic
export const getHeatmapData = async (): Promise<HeatmapData[] | null> => {
  const maxRetries = 5;
  const retryDelay = 1000; // 1 second delay between retries
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await apiService.get("/spatial/heatmaps", {
        params: {
          token: apiToken,
        },
      });

      // Check if response has valid data
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      
      console.warn(`Attempt ${attempt}: No heatmap data found in response, retrying...`);
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt)); // Exponential backoff
      }
      
    } catch (error) {
      console.error(`Attempt ${attempt}: Error fetching heatmap data:`, error);
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  console.error("All 5 attempts failed to fetch heatmap data");
  return null;
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
    const response = await apiService.get("/predict/daily-forecasting", {
      params: apiToken ? { token: apiToken } : undefined,
    })

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
      ...(apiToken ? { token: apiToken } : {}),
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
  const sites = pages
    .flatMap((page) => page.forecasts || [])
    .filter((site) => site.site_details?.site_id === siteId)

  if (!sites.length) return null

  const firstSite = sites[0]
  const forecastByTimestamp = new Map<string, HourlyForecastEntry>()

  sites.forEach((site) => {
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

export const getHourlyForecast = async (siteId: string, hours = 168, pageSize = 10): Promise<HourlyForecastSite | null> => {
  try {
    const firstPage = await getHourlyForecastPage(siteId, 1, pageSize, hours)
    if (!firstPage) return null

    const totalPages = Math.max(1, firstPage.total_pages || 1)
    const remainingPages =
      totalPages > 1
        ? await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) => getHourlyForecastPage(siteId, index + 2, pageSize, hours)),
          )
        : []

    const pages = [firstPage, ...remainingPages.filter((page): page is HourlyForecastResponse => !!page)]
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
  }
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
          token: apiToken,
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
