export type SearchPlace = {
  id: string
  label: string
  center: [number, number]
  bounds?: [[number, number], [number, number]]
}

const MAPBOX_ENDPOINT = "https://api.mapbox.com/geocoding/v5/mapbox.places"
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search"

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

async function searchMapbox(query: string, signal?: AbortSignal): Promise<SearchPlace[]> {
  if (!mapboxToken) return []
  const url = `${MAPBOX_ENDPOINT}/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Mapbox geocoding failed: ${response.status}`)
  const data: { features?: Array<{ id?: string; place_name?: string; center?: number[]; bbox?: number[] }> } =
    await response.json()

  if (!Array.isArray(data.features)) return []
  return data.features
    .filter((f): f is NonNullable<typeof f> => !!f)
    .map((feature): SearchPlace | null => {
      const center = Array.isArray(feature.center) && feature.center.length >= 2 ? feature.center : null
      if (!center) return null
      const bounds =
        Array.isArray(feature.bbox) && feature.bbox.length === 4
          ? ([[feature.bbox[1], feature.bbox[0]], [feature.bbox[3], feature.bbox[2]]] as [[number, number], [number, number]])
          : undefined
      return {
        id: feature.id ?? `${feature.place_name}-${center[0]}-${center[1]}`,
        label: feature.place_name ?? `${center[1]}, ${center[0]}`,
        center: [center[1], center[0]] as [number, number],
        bounds,
      }
    })
    .filter((place): place is SearchPlace => !!place)
}

async function searchNominatim(query: string, signal?: AbortSignal): Promise<SearchPlace[]> {
  const url = `${NOMINATIM_ENDPOINT}?format=jsonv2&q=${encodeURIComponent(query)}&limit=5`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Nominatim geocoding failed: ${response.status}`)
  const data: Array<{ place_id?: number; display_name?: string; lat?: string; lon?: string; boundingbox?: string[] }> =
    await response.json()

  if (!Array.isArray(data)) return []
  return data
    .map((item): SearchPlace | null => {
      const lat = Number.parseFloat(item.lat ?? "")
      const lon = Number.parseFloat(item.lon ?? "")
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
      let bounds: [[number, number], [number, number]] | undefined
      if (Array.isArray(item.boundingbox) && item.boundingbox.length === 4) {
        const south = Number.parseFloat(item.boundingbox[0])
        const north = Number.parseFloat(item.boundingbox[1])
        const west = Number.parseFloat(item.boundingbox[2])
        const east = Number.parseFloat(item.boundingbox[3])
        if ([south, north, west, east].every((v) => Number.isFinite(v))) {
          bounds = [[south, west], [north, east]]
        }
      }
      return {
        id: String(item.place_id ?? `${item.display_name}-${lat}-${lon}`),
        label: item.display_name ?? `${lat}, ${lon}`,
        center: [lat, lon] as [number, number],
        bounds,
      }
    })
    .filter((place): place is SearchPlace => !!place)
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<SearchPlace[]> {
  const trimmed = (query || "").trim()
  if (trimmed.length < 2) return []
  if (signal?.aborted) return []

  if (mapboxToken) {
    try {
      return await searchMapbox(trimmed, signal)
    } catch (error) {
      if (signal?.aborted) return []
      const message = error instanceof Error ? error.message : "Mapbox geocoding request failed"
      console.warn(message)
    }
  }

  try {
    return await searchNominatim(trimmed, signal)
  } catch (error) {
    if (signal?.aborted) return []
    const message = error instanceof Error ? error.message : "Nominatim geocoding request failed"
    console.warn(message)
    return []
  }
}
