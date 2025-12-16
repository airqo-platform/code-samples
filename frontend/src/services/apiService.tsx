import axios from "axios"

// Remove the incorrect import and add the utility function directly
const removeTrailingSlash = (url: string): string => {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

const apiToken = process.env.NEXT_PUBLIC_API_TOKEN
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""
const BASE_URL_API = process.env.NEXT_PUBLIC_AIRQO_API_URL || ""
// Axios instance with a base URL and default headers
const apiService = axios.create({
  baseURL: removeTrailingSlash(BASE_URL),
  headers: {
    "Content-Type": "application/json",
  },
})

const apiServiceApi = axios.create({
  baseURL: removeTrailingSlash(BASE_URL_API),
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

export interface ReportRangeParams {
  siteIds: string[]
  startTime: string
  endTime: string
}

export interface SiteReportMetrics {
  site_id: string
  pm2_5_avg: number | null
  pm10_avg: number | null
  count: number
  lastTime: string | null
  aqi_category: string
  aqi_color: string
}

export interface ReportTimeSeriesPoint {
  site_id: string
  time: string
  pm2_5: number | null
  siteName: string
  city: string
}

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)

const mean = (values: number[]): number | null => {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const extractPm25 = (measurement: any): number | null => {
  const candidates = [
    measurement?.pm2_5?.calibrated?.value,
    measurement?.pm2_5_calibrated?.value,
    measurement?.pm2_5_calibrated_value,
    measurement?.pm2_5?.value,
  ]
  for (const candidate of candidates) {
    if (isFiniteNumber(candidate)) return candidate
  }
  return null
}

const extractPm10 = (measurement: any): number | null => {
  const candidates = [
    measurement?.pm10?.calibrated?.value,
    measurement?.pm10_calibrated?.value,
    measurement?.pm10_calibrated_value,
    measurement?.pm10?.value,
  ]
  for (const candidate of candidates) {
    if (isFiniteNumber(candidate)) return candidate
  }
  return null
}

const computeAqiFromPm25 = (
  pm25: number | null,
): {
  aqi_category: string
  aqi_color: string
} => {
  if (!isFiniteNumber(pm25)) {
    return { aqi_category: "Unknown", aqi_color: "#9CA3AF" }
  }

  if (pm25 <= 12.0) return { aqi_category: "Good", aqi_color: "#22C55E" }
  if (pm25 <= 35.4) return { aqi_category: "Moderate", aqi_color: "#EAB308" }
  if (pm25 <= 55.4) return { aqi_category: "Unhealthy for Sensitive Groups", aqi_color: "#F97316" }
  if (pm25 <= 150.4) return { aqi_category: "Unhealthy", aqi_color: "#EF4444" }
  if (pm25 <= 250.4) return { aqi_category: "Very Unhealthy", aqi_color: "#A855F7" }
  return { aqi_category: "Hazardous", aqi_color: "#7F1D1D" }
}

const mapWithConcurrency = async <Item, Result>(
  items: Item[],
  concurrency: number,
  mapper: (item: Item) => Promise<Result>,
): Promise<Result[]> => {
  const results: Result[] = []
  const queue = [...items]
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      if (item === undefined) return
      results.push(await mapper(item))
    }
  })
  await Promise.all(workers)
  return results
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

export const getReportSitesCatalog = async (): Promise<MapNode[] | null> => {
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
    console.error("Error fetching report catalog data:", error)
    return null
  }
}

// Fetch report metrics from the sites measurements endpoint for multiple site IDs.
export const getReportData = async ({ siteIds, startTime, endTime }: ReportRangeParams): Promise<SiteReportMetrics[] | null> => {
  if (!siteIds.length) return []

  const uniqueSiteIds = Array.from(new Set(siteIds.filter(Boolean)))

  try {
    const metrics = await mapWithConcurrency(uniqueSiteIds, 10, async (siteId) => {
      try {
        const response = await apiService.get(`/devices/measurements/sites/${siteId}`, {
          params: {
            token: apiToken,
            startTime,
            endTime,
          },
        })

        const payload = Array.isArray(response.data) ? response.data[0] : response.data
        const measurements: any[] = Array.isArray(payload?.measurements) ? payload.measurements : []

        const pm25Values = measurements.map(extractPm25).filter(isFiniteNumber)
        const pm10Values = measurements.map(extractPm10).filter(isFiniteNumber)

        const pm2_5_avg = mean(pm25Values)
        const pm10_avg = mean(pm10Values)

        const lastTime = measurements
          .map((measurement) => measurement?.time)
          .filter((time) => typeof time === "string")
          .sort()
          .at(-1) ?? null

        const { aqi_category, aqi_color } = computeAqiFromPm25(pm2_5_avg)

        return {
          site_id: siteId,
          pm2_5_avg,
          pm10_avg,
          count: measurements.length,
          lastTime,
          aqi_category,
          aqi_color,
        } satisfies SiteReportMetrics
      } catch (siteError) {
        console.error(`Error fetching report metrics for site ${siteId}:`, siteError)
        return null
      }
    })

    return metrics.filter(Boolean) as SiteReportMetrics[]
  } catch (error) {
    console.error("Error fetching report metrics:", error)
    return null
  }
}

export const getReportTimeSeries = async ({
  siteIds,
  startTime,
  endTime,
}: ReportRangeParams): Promise<ReportTimeSeriesPoint[] | null> => {
  if (!siteIds.length) return []

  const uniqueSiteIds = Array.from(new Set(siteIds.filter(Boolean)))

  try {
    const responses = await mapWithConcurrency(uniqueSiteIds, 8, async (siteId) => {
      try {
        const response = await apiService.get(`/devices/measurements/sites/${siteId}`, {
          params: {
            token: apiToken,
            startTime,
            endTime,
          },
        })

        const payload = Array.isArray(response.data) ? response.data[0] : response.data
        const measurements: any[] = Array.isArray(payload?.measurements) ? payload.measurements : []

        const points = measurements
          .map((measurement) => {
            const time = measurement?.time
            if (typeof time !== "string") return null

            const siteDetails = measurement?.siteDetails ?? {}
            const siteName = siteDetails?.name ?? siteDetails?.formatted_name ?? "Unknown Site"
            const city = siteDetails?.city ?? "Unknown City"

            return {
              site_id: siteId,
              time,
              pm2_5: extractPm25(measurement),
              siteName,
              city,
            } satisfies ReportTimeSeriesPoint
          })
          .filter(Boolean) as ReportTimeSeriesPoint[]

        return points
      } catch (siteError) {
        console.error(`Error fetching report timeseries for site ${siteId}:`, siteError)
        return []
      }
    })

    return responses.flat()
  } catch (error) {
    console.error("Error fetching report timeseries:", error)
    return null
  }
}

// Get heatmap data from the spatial heatmaps endpoint with retry logic
export const getHeatmapData = async (): Promise<HeatmapData[] | null> => {
  const maxRetries = 5;
  const retryDelay = 1000; // 1 second delay between retries
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await apiServiceApi.get("/spatial/heatmaps", {
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
