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

// types/type.d.ts

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

import type L from "leaflet"

export interface MapProps {
  map: L.Map
}
