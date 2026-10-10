import type { WindBounds } from "./wind-field"

export interface TemperatureField extends WindBounds {
  columns: number
  rows: number
  times: string[]
  // Each hour contains a row-major grid, running south to north.
  temperatures: (number | null)[][]
}

export const TEMPERATURE_COLORS = [
  [113, 69, 153], [71, 129, 190], [75, 187, 180],
  [211, 220, 120], [248, 172, 76], [215, 64, 60],
]

export function sampleTemperature(field: TemperatureField, hour: number, latitude: number, longitude: number): number | null {
  const values = field.temperatures[hour]
  if (!values || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  const centre = (field.west + field.east) / 2
  const lng = longitude + 360 * Math.round((centre - longitude) / 360)
  if (latitude < field.south || latitude > field.north || lng < field.west || lng > field.east) return null
  const x = (lng - field.west) / (field.east - field.west) * (field.columns - 1)
  const y = (latitude - field.south) / (field.north - field.south) * (field.rows - 1)
  const col = Math.min(Math.floor(x), field.columns - 2)
  const row = Math.min(Math.floor(y), field.rows - 2)
  const fx = x - col
  const fy = y - row
  const corners = [
    [row * field.columns + col, (1 - fx) * (1 - fy)],
    [row * field.columns + col + 1, fx * (1 - fy)],
    [(row + 1) * field.columns + col, (1 - fx) * fy],
    [(row + 1) * field.columns + col + 1, fx * fy],
  ]
  let temperature = 0
  for (const [index, weight] of corners) {
    if (weight < 1e-10) continue
    const value = values[index]
    if (typeof value !== "number" || !Number.isFinite(value)) return null
    temperature += value * weight
  }
  return temperature
}

export function temperatureScale(field: TemperatureField): [number, number] {
  let min = Infinity
  let max = -Infinity
  for (const grid of field.temperatures) {
    for (const value of grid) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue
      min = Math.min(min, value)
      max = Math.max(max, value)
    }
  }
  if (!Number.isFinite(min)) return [0, 40]
  const low = Math.floor(min / 5) * 5
  return [low, Math.max(low + 10, Math.ceil(max / 5) * 5)]
}

export function temperatureColor(temperature: number, scale: [number, number]): number[] {
  const position = Math.max(0, Math.min(1, (temperature - scale[0]) / (scale[1] - scale[0]))) * (TEMPERATURE_COLORS.length - 1)
  const index = Math.min(Math.floor(position), TEMPERATURE_COLORS.length - 2)
  return TEMPERATURE_COLORS[index].map((value, channel) => Math.round(value + (TEMPERATURE_COLORS[index + 1][channel] - value) * (position - index)))
}
