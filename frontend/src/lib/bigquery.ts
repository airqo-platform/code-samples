import { BigQuery } from "@google-cloud/bigquery"
import type { DateRange } from "@/lib/types"

// Initialize BigQuery with credentials from environment variables
let bigqueryClient: BigQuery | null = null

export function getBigQueryClient(): BigQuery {
  if (!bigqueryClient) {
    try {
      // Check if credentials are provided as JSON string
      const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON

      if (credentials) {
        // Parse credentials from JSON string
        bigqueryClient = new BigQuery({
          projectId: process.env.BIGQUERY_PROJECT_ID,
          credentials: JSON.parse(credentials),
        })
      } else {
        // Use credentials file path
        bigqueryClient = new BigQuery({
          projectId: process.env.BIGQUERY_PROJECT_ID,
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        })
      }
    } catch (error) {
      console.error("Failed to initialize BigQuery client:", error)
      throw new Error("BigQuery client initialization failed")
    }
  }

  return bigqueryClient
}

export async function getHistoricalData(siteId: string, dateRange: DateRange) {
  const bigquery = getBigQueryClient()

  // Format dates for SQL query
  const startDate = dateRange.startDate.toISOString()
  const endDate = dateRange.endDate.toISOString()

  // SQL query to fetch historical data
  const query = `
    SELECT 
      timestamp,
      pm2_5,
      pm10,
      temperature,
      humidity,
      site_id
    FROM 
      \`airqo-250220.consolidated_data.hourly_device_measurements\`
    WHERE 
      site_id = @siteId
      AND timestamp BETWEEN TIMESTAMP(@startDate) AND TIMESTAMP(@endDate)
    ORDER BY 
      timestamp ASC
  `

  const options = {
    query,
    params: {
      siteId: siteId,
      startDate: startDate,
      endDate: endDate,
    },
  }

  try {
    const [rows] = await bigquery.query(options)
    return rows
  } catch (error) {
    console.error("BigQuery query error:", error)
    throw error
  }
}

// Helper function to get predefined date ranges
export function getDateRange(period: string): DateRange {
  const endDate = new Date()
  const startDate = new Date()

  switch (period) {
    case "7days":
      startDate.setDate(endDate.getDate() - 7)
      break
    case "14days":
      startDate.setDate(endDate.getDate() - 14)
      break
    case "1month":
      startDate.setMonth(endDate.getMonth() - 1)
      break
    case "3months":
      startDate.setMonth(endDate.getMonth() - 3)
      break
    case "6months":
      startDate.setMonth(endDate.getMonth() - 6)
      break
    default:
      // Default to 7 days
      startDate.setDate(endDate.getDate() - 7)
  }

  return { startDate, endDate }
}

