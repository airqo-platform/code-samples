export interface WindBounds {
  west: number
  east: number
  south: number
  north: number
}

export interface WindVector { u: number; v: number }

export interface WindField extends WindBounds {
  columns: number
  rows: number
  // Row-major, from south to north. Components point TO where the wind blows.
  vectors: (WindVector | null)[]
  time: string
}

export const WIND_COLORS = [
  { speed: 0, rgb: [74, 64, 139] },
  { speed: 3, rgb: [49, 103, 173] },
  { speed: 5, rgb: [40, 151, 161] },
  { speed: 10, rgb: [76, 174, 93] },
  { speed: 15, rgb: [210, 175, 64] },
  { speed: 20, rgb: [213, 83, 66] },
  { speed: 30, rgb: [151, 55, 131] },
]

export const wrapLongitude = (longitude: number) => ((longitude + 180) % 360 + 360) % 360 - 180

export function windVector(speed: unknown, direction: unknown): WindVector | null {
  if (typeof speed !== "number" || !Number.isFinite(speed) || speed < 0) return null
  if (speed === 0) return { u: 0, v: 0 }
  if (typeof direction !== "number" || !Number.isFinite(direction) || direction < 0 || direction > 360) return null
  const radians = direction * Math.PI / 180
  return { u: -speed * Math.sin(radians), v: -speed * Math.cos(radians) }
}

export function sampleWind(field: WindField, latitude: number, longitude: number): WindVector | null {
  // Unwrap around this field's centre, including fields crossing the date line.
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
  let u = 0
  let v = 0
  for (const [index, weight] of corners) {
    if (weight < 1e-10) continue
    const vector = field.vectors[index]
    // Do not invent wind across missing model data.
    if (!vector) return null
    u += vector.u * weight
    v += vector.v * weight
  }
  return { u, v }
}

export function windColor(speed: number): number[] {
  const upper = WIND_COLORS.findIndex((stop) => stop.speed > speed)
  if (upper < 0) return WIND_COLORS[WIND_COLORS.length - 1].rgb
  if (upper === 0) return WIND_COLORS[0].rgb
  const low = WIND_COLORS[upper - 1]
  const high = WIND_COLORS[upper]
  const fraction = (speed - low.speed) / (high.speed - low.speed)
  return low.rgb.map((value, channel) => Math.round(value + (high.rgb[channel] - value) * fraction))
}
