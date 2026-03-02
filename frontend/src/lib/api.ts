import type {
  SiteLocatorPayload,
  SiteLocatorResponse,
  LegacyCategorizeSiteResponse,
  SourceMetadataResponse,
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
    queryParams?: Record<string, string | number | boolean>
    json?: unknown
  } = {},
): Promise<T> {
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

  // Log request details
  //console.log("Making API request to:", url.toString());
  if (options.json) console.log("Request payload:", options.json)

  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers,
    body,
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error("API Error Response:", errorData)
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
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

export async function getSiteCategory(
  latitude: number,
  longitude: number,
  includeSatellite = true,
): Promise<SourceMetadataResponse> {
  try {
    if (includeSatellite) {
      const response = await baseFetch<unknown>("spatial/source_metadata", {
        queryParams: { latitude, longitude, include_satellite: true },
      })
      return unwrapSourceMetadataResponse(response)
    }

    const response = await baseFetch<unknown>("spatial/categorize_site", {
      queryParams: { latitude, longitude },
    })
    return normalizeLegacyCategorizeSiteResponse(response, latitude, longitude)
  } catch (error) {
    console.error("Error getting site category:", error)
    throw error
  }
}

function unwrapSourceMetadataResponse(payload: unknown): SourceMetadataResponse {
  let current = payload

  while (Array.isArray(current)) {
    if (current.length === 0) {
      throw new Error("Empty source metadata response.")
    }
    current = current[0]
  }

  if (!current || typeof current !== "object" || !("data" in current) || !("message" in current)) {
    throw new Error("Unexpected source metadata response format.")
  }

  return current as SourceMetadataResponse
}

function normalizeLegacyCategorizeSiteResponse(
  payload: unknown,
  latitude: number,
  longitude: number,
): SourceMetadataResponse {
  let current = payload

  while (Array.isArray(current)) {
    if (current.length === 0) {
      throw new Error("Empty categorize site response.")
    }
    current = current[0]
  }

  if (!current || typeof current !== "object" || !("site" in current)) {
    throw new Error("Unexpected categorize site response format.")
  }

  const response = current as LegacyCategorizeSiteResponse
  const siteCategory = response.site["site-category"]

  return {
    data: {
      candidate_sources: [],
      evidence: {
        osm_debug_info: response.site.OSM_info ?? [],
        satellite_error: null,
        satellite_pollutants_mean: {},
        satellite_reasoning: [],
        site_category: {
          area_name: siteCategory?.area_name ?? null,
          category: siteCategory?.category ?? null,
          highway: siteCategory?.highway ?? null,
          landuse: siteCategory?.landuse ?? null,
          natural: siteCategory?.natural ?? null,
          search_radius: siteCategory?.search_radius ?? null,
          waterway: siteCategory?.waterway ?? null,
        },
        site_reasoning: [],
      },
      location: {
        latitude: siteCategory?.latitude ?? latitude,
        longitude: siteCategory?.longitude ?? longitude,
      },
      metadata: {
        computed_at_utc: "",
        data_sources: ["OpenStreetMap (Overpass)"],
        date_range: {
          start_date: "",
          end_date: "",
        },
        disclaimer: "Site category is inferred from OpenStreetMap context only.",
        model_version: "",
      },
      primary_source: null,
    },
    message: "Operation successful",
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
