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

interface DailyForecastItem {
  time: string
  pm2_5: number | null
  aqi_category?: string
  aqi_color?: string
  aqi_color_name?: string
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

export const getDailyForecast = async (siteId: string): Promise<DailyForecastItem[] | null> => {
  try {
    const response = await apiService.get("/predict/daily-forecast", {
      params: {
        site_id: siteId,
        token: apiToken,
      },
    })

    const data = response.data

    if (Array.isArray(data)) {
      const first = data[0]
      if (first && Array.isArray(first.forecasts)) return first.forecasts
      if (data.every((x) => x && typeof x === "object" && "time" in x)) return data as DailyForecastItem[]
    }

    if (data && typeof data === "object" && Array.isArray((data as any).forecasts)) {
      return (data as any).forecasts as DailyForecastItem[]
    }

    return null
  } catch (error) {
    console.error("Error fetching daily forecast:", error)
    return null
  }
}
