import type {
  SiteLocatorPayload,
  SiteLocatorResponse,
  LegacyCategorizeSiteResponse,
  SourceMetadataResponse,
  AirQualityReportPayload,
  AirQualityReportResponse,
  Grid,
} from "./types"

class ApiRequestError extends Error {
  status: number

  constructor(status: number, statusText: string, body: string) {
    super(`API request failed: ${status} ${statusText}${body ? ` - ${body}` : ""}`)
    this.name = "ApiRequestError"
    this.status = status
  }
}

const RETRYABLE_API_STATUSES = new Set([401, 403, 429, 500, 502, 503, 504])
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function baseFetch<T>(
  endpoint: string,
  options: {
    method?: string
    queryParams?: Record<string, string | number | boolean>
    json?: unknown
  } = {},
): Promise<T> {
  const normalizedEndpoint = endpoint.replace(/^\/+/, "")
  const url = new URL(`/api/airqo/${normalizedEndpoint}`, window.location.origin)

  // Add query parameters
  if (options.queryParams) {
    Object.entries(options.queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })
  }

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

  const method = options.method || "GET"
  const maxAttempts = method === "GET" ? 2 : 1

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
      cache: "no-store",
    })

    if (response.ok) {
      return response.json() as Promise<T>
    }

    const errorData = await response.text()
    console.error("API Error Response:", errorData)

    if (attempt < maxAttempts && RETRYABLE_API_STATUSES.has(response.status)) {
      await delay(500)
      continue
    }

    throw new ApiRequestError(response.status, response.statusText, errorData)
  }

  throw new Error("API request failed after retry.")
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
      try {
        const response = await baseFetch<unknown>("spatial/source_metadata", {
          queryParams: { latitude, longitude, include_satellite: true },
        })
        return unwrapSourceMetadataResponse(response)
      } catch (error) {
        if (!(error instanceof ApiRequestError) || error.status !== 401) throw error
        console.warn("Source metadata returned 401. Falling back to OSM-only site categorization.")
      }
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
