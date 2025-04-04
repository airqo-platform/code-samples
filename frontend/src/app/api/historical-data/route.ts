import { NextResponse } from "next/server"
import { getHistoricalData, getDateRange } from "@/lib/bigquery"
import { z } from "zod"

// Schema for request validation
const requestSchema = z.object({
  siteId: z.string().min(1),
  period: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = requestSchema.parse(body)

    // Get date range from period or specific dates
    let dateRange
    if (validatedData.period) {
      dateRange = getDateRange(validatedData.period)
    } else if (validatedData.startDate && validatedData.endDate) {
      dateRange = {
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
      }
    } else {
      // Default to last 7 days
      dateRange = getDateRange("7days")
    }

    // Fetch data from BigQuery
    const data = await getHistoricalData(validatedData.siteId, dateRange)

    return NextResponse.json({
      success: true,
      data,
      dateRange: {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error in historical data API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    )
  }
}

