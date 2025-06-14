export interface WindHeader {
  parameterUnit: string
  parameterNumber: number
  parameterNumberName: string
  nx: number
  ny: number
  lo1: number
  la1: number
  lo2: number
  la2: number
  dx: number
  dy: number
  refTime: string
}

export interface WindDataRecord {
  header: WindHeader
  data: number[]
}

export interface WindData {
  data: WindDataRecord[]
}

export type Bounds = [[number, number], [number, number]]

export interface AqiMapImage {
  image: string
  bounds: Bounds
  lat_min: number
  lat_max: number
  lon_min: number
  lon_max: number
}

export interface AqiMapData {
  mapimage: AqiMapImage
  time: {
    generated_at: string
  }
}

// Leaflet-velocity type definitions
declare global {
  namespace L {
    function velocityLayer(options: VelocityOptions): L.Layer
  }
}

export interface VelocityDisplayOptions {
  velocityType?: string
  position?: string
  emptyString?: string
  angleConvention?: string
  showCardinal?: boolean
  speedUnit?: string
  directionString?: string
  speedString?: string
}

export interface VelocityOptions {
  displayValues?: boolean
  displayOptions?: VelocityDisplayOptions
  data: any
  maxVelocity?: number
  velocityScale?: number
  particleAge?: number
  lineWidth?: number
  particleMultiplier?: number
  frameRate?: number
  colorScale?: string[]
}

export interface MapProps {
  map: any // Placeholder for L.Map type, as L is not redeclared
}
