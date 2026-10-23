import type * as Leaflet from "leaflet"

export const MAPBOX_STYLES = {
  streets: "mapbox/streets-v11",
  satellite: "mapbox/satellite-streets-v11",
  light: "mapbox/light-v11",
  dark: "mapbox/dark-v11",
} as const

export type MapStyle = keyof typeof MAPBOX_STYLES

export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'

let mapboxTokenWarned = false

export function getMapTileConfig(
  style: MapStyle = "streets",
  token: string | undefined = process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
) {
  if (!token) {
    if (!mapboxTokenWarned) {
      mapboxTokenWarned = true
      console.warn(
        "NEXT_PUBLIC_MAPBOX_TOKEN is not set; map tiles fall back to OpenStreetMap.",
      )
    }
    return {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      tileSize: 256,
      zoomOffset: 0,
    }
  }

  return {
    url: `https://api.mapbox.com/styles/v1/${MAPBOX_STYLES[style]}/tiles/{z}/{x}/{y}?access_token=${token}`,
    attribution: MAP_ATTRIBUTION,
    tileSize: 512,
    zoomOffset: -1,
  }
}

export type MapStyleOption = {
  id: MapStyle
  label: string
  previewUrl: string
  description: string
}

export const MAP_STYLE_OPTIONS: MapStyleOption[] = [
  {
    id: "streets",
    label: "Streets",
    previewUrl: "/images/map/street.webp",
    description: "Standard street map with labels",
  },
  {
    id: "light",
    label: "Light",
    previewUrl: "/images/map/light.webp",
    description: "Light-colored map for data visualization",
  },
  {
    id: "satellite",
    label: "Satellite",
    previewUrl: "/images/map/satellite.webp",
    description: "Satellite imagery with street overlays",
  },
  {
    id: "dark",
    label: "Dark",
    previewUrl: "/images/map/dark.webp",
    description: "Dark-colored map for night viewing",
  },
]

export function configureLeafletDefaultIcons() {
  if (typeof window === "undefined") return
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional lazy require: keeps Leaflet off the SSR path
  const L = require("leaflet") as typeof Leaflet
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  })
}
