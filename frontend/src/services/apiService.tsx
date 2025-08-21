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

// Get heatmap data from the spatial heatmaps endpoint
export const getHeatmapData = async (): Promise<HeatmapData[] | null> => {
  try {
    const response = await apiServiceApi.get("/spatial/heatmaps", {
      params: {
        token: apiToken,
      },
    })

    // Check if response has data
    if (!response.data || !Array.isArray(response.data)) {
      console.error("No heatmap data found in response")
      return null
    }

    return response.data
  } catch (error) {
    console.error("Error fetching heatmap data:", error)
    return null
  }
}
