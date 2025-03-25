import type {
  SiteLocatorPayload,
  SiteLocatorResponse,
  SiteCategoryResponse,
  AirQualityReportPayload,
  AirQualityReportResponse,
  Grid,
} from "./types"

function getApiConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  const token = process.env.NEXT_PUBLIC_API_TOKEN

  if (!baseUrl || !token) {
    throw new Error("API configuration is missing. Ensure NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_TOKEN are set.")
  }

  return { baseUrl, token }
}

async function baseFetch<T>(
  endpoint: string,
  options: {
    method?: string
    queryParams?: Record<string, string | number>
    json?: unknown
  } = {},
): Promise<T> {
  try {
    const { baseUrl, token } = getApiConfig()
    const url = new URL(endpoint, baseUrl)

    // Add query parameters
    if (options.queryParams) {
      Object.entries(options.queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    // Add API token
    url.searchParams.append("token", token)

    // Configure headers
    const headers: HeadersInit = {
      Accept: "application/json",
    }

    // Configure body
    let body: BodyInit | undefined
    if (options.json) {
      headers["Content-Type"] = "application/json"
      body = JSON.stringify(options.json)
    }

    const response = await fetch(url.toString(), {
      method: options.method || "GET",
      headers,
      body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`

      try {
        // Try to parse error as JSON for more details
        const errorJson = JSON.parse(errorText)
        if (errorJson.message || errorJson.error) {
          errorMessage = errorJson.message || errorJson.error
        }
      } catch (e) {
        // If not JSON, use the text as is
        if (errorText) {
          errorMessage += ` - ${errorText}`
        }
      }

      throw new Error(errorMessage)
    }

    return response.json() as Promise<T>
  } catch (error) {
    console.error(`API Error in ${endpoint}:`, error)
    throw error
  }
}

export async function submitLocations(payload: SiteLocatorPayload): Promise<SiteLocatorResponse> {
  try {
    return await baseFetch<SiteLocatorResponse>("spatial/site_location", {
      method: "POST",
      json: payload,
    })
  } catch (error) {
    console.error("Error submitting locations:", error)
    throw error
  }
}

export async function getSiteCategory(latitude: number, longitude: number): Promise<SiteCategoryResponse> {
  try {
    return await baseFetch<SiteCategoryResponse>("spatial/categorize_site", {
      queryParams: { latitude, longitude },
    })
  } catch (error) {
    console.error("Error getting site category:", error)
    throw error
  }
}

export async function getAirQualityReport(payload: AirQualityReportPayload): Promise<AirQualityReportResponse> {
  try {
    return await baseFetch<AirQualityReportResponse>("spatial/air_quality_report", {
      method: "POST",
      json: payload,
    })
  } catch (error) {
    console.error("Error getting air quality report:", error)
    throw error
  }
}

export async function fetchGrids(): Promise<Grid[]> {
  try {
    const data = await baseFetch<{ grids: Grid[] }>("devices/grids/summary")
    return data.grids
  } catch (error) {
    console.error("Error fetching grids:", error)
    throw error
  }
}

