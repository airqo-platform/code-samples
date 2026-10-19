import type L from "leaflet"
import { wrapLongitude } from "@/lib/wind-field"

export function weatherViewportQuery(map: L.Map) {
  const bounds = map.getBounds().pad(0.12)
  const step = Math.max(0.02, Math.pow(2, Math.floor(Math.log2(Math.max(bounds.getEast() - bounds.getWest(), 0.02) / 24))))
  const west = Math.floor(bounds.getWest() / step) * step
  const east = Math.ceil(bounds.getEast() / step) * step
  const span = Math.min(360, east - west)
  const normalizedWest = span === 360 ? -180 : wrapLongitude(west)
  const south = Math.max(-85, Math.min(84.98, Math.floor(bounds.getSouth() / step) * step))
  const north = Math.min(85, Math.max(south + 0.02, Math.ceil(bounds.getNorth() / step) * step))
  return new URLSearchParams({ west: normalizedWest.toFixed(4), east: (normalizedWest + span).toFixed(4), south: south.toFixed(4), north: north.toFixed(4) }).toString()
}
