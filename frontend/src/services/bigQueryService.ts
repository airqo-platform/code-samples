import axios from "axios"
import { removeTrailingSlash } from "@/utils"

const apiToken = process.env.NEXT_PUBLIC_API_TOKEN
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""
// Add these environment variables
const GOOGLE_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS
const BIGQUERY_DATASET_ID = process.env.BIGQUERY_DATASET_ID

// Axios instance with a base URL and default headers
const apiService = axios.create({
  baseURL: removeTrailingSlash(BASE_URL),
  headers: {
    "Content-Type": "application/json",
  },
})

// Update the BigQueryMeasurement interface to reflect the timestamp format
export interface BigQueryMeasurement {
  timestamp: string // Format: "YYYY-MM-DD HH:MM:SS UTC"
  pm2_5: number
  pm10: number
  temperature?: number
  humidity?: number
  site_id: string
  device_id?: string
}

export interface BigQueryParams {
  site_id: string
  start_date: string // ISO format date string
  end_date: string // ISO format date string
}

export interface BigQueryResponse {
  measurements: BigQueryMeasurement[]
  metadata: {
    site_id: string
    device_id?: string
    site_name?: string
    total_records: number
    date_range: {
      start: string
      end: string
    }
  }
}

// Update the fetchHistoricalData function to include the Google credentials
export const fetchHistoricalData = async (params: BigQueryParams): Promise<BigQueryResponse> => {
  try {
    const response = await apiService.get("/devices/readings/historical", {
      params: {
        ...params,
        token: apiToken,
        dataset_id: BIGQUERY_DATASET_ID, // Add the dataset ID from environment variables
      },
      headers: {
        // Add Google credentials if available
        ...(GOOGLE_CREDENTIALS ? { "X-Google-Credentials": GOOGLE_CREDENTIALS } : {}),
      },
    })

    if (!response.data || !response.data.measurements) {
      throw new Error("Invalid response format from API")
    }

    return response.data
  } catch (error) {
    console.error("Error fetching historical data:", error)
    throw error
  }
}

export const fetchHistoricalDataBySiteId = async (
  site_id: string,
  start_date: Date,
  end_date: Date,
): Promise<BigQueryResponse> => {
  try {
    // Format dates to ISO strings
    const startDateStr = start_date.toISOString()
    const endDateStr = end_date.toISOString()

    // Add this at the beginning of the fetchHistoricalDataBySiteId function
    console.log("Fetching historical data with params:", {
      site_id,
      start_date: startDateStr,
      end_date: endDateStr,
    })

    const params: BigQueryParams = {
      site_id,
      start_date: startDateStr,
      end_date: endDateStr,
    }

    const response = await fetchHistoricalData(params)

    // Add this after the fetchHistoricalData call
    console.log(
      "Received historical data with first timestamp:",
      response.measurements.length > 0 ? response.measurements[0].timestamp : "No data",
    )

    return response
  } catch (error) {
    console.error(`Error fetching historical data for site ${site_id}:`, error)
    throw error
  }
}

// Update the mockHistoricalData function to format timestamps correctly
export const mockHistoricalData = (site_id: string, start_date: Date, end_date: Date): BigQueryResponse => {
  const daysDiff = Math.ceil((end_date.getTime() - start_date.getTime()) / (1000 * 60 * 60 * 24))
  const measurements: BigQueryMeasurement[] = []

  // Generate hourly data for the date range
  for (let i = 0; i < daysDiff; i++) {
    for (let hour = 0; hour < 24; hour++) {
      const currentDate = new Date(start_date)
      currentDate.setDate(currentDate.getDate() + i)
      currentDate.setHours(hour, 0, 0, 0)

      // Generate some realistic-looking data with daily and weekly patterns
      const dayFactor = Math.sin((hour / 24) * Math.PI * 2) * 10 + 20 // Daily cycle
      const weekFactor = Math.sin((i / 7) * Math.PI) * 5 // Weekly cycle
      const randomFactor = Math.random() * 10 - 5 // Random noise

      const pm25 = Math.max(5, dayFactor + weekFactor + randomFactor)
      const pm10 = pm25 * (1.5 + Math.random() * 0.5)
      const temperature = 25 + Math.sin((hour / 24) * Math.PI * 2) * 5 + Math.random() * 2
      const humidity = 60 + Math.sin((hour / 24) * Math.PI * 2) * 10 + Math.random() * 5

      // Format timestamp as "YYYY-MM-DD HH:MM:SS UTC"
      const formattedTimestamp = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")} ${String(currentDate.getHours()).padStart(2, "0")}:00:00 UTC`

      measurements.push({
        timestamp: formattedTimestamp,
        pm2_5: Number.parseFloat(pm25.toFixed(1)),
        pm10: Number.parseFloat(pm10.toFixed(1)),
        temperature: Number.parseFloat(temperature.toFixed(1)),
        humidity: Number.parseFloat(humidity.toFixed(1)),
        site_id,
        device_id: `device_${site_id}`,
      })
    }
  }

  return {
    measurements,
    metadata: {
      site_id,
      device_id: `device_${site_id}`,
      site_name: `Site ${site_id}`,
      total_records: measurements.length,
      date_range: {
        start: `${start_date.getFullYear()}-${String(start_date.getMonth() + 1).padStart(2, "0")}-${String(start_date.getDate()).padStart(2, "0")} 00:00:00 UTC`,
        end: `${end_date.getFullYear()}-${String(end_date.getMonth() + 1).padStart(2, "0")}-${String(end_date.getDate()).padStart(2, "0")} 23:59:59 UTC`,
      },
    },
  }
}

