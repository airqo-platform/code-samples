export type ManagedPage = {
  id: string
  name: string
  path: string
  enabled: boolean
}

export type ManagedFeature = {
  id: "heatmap" | "capture-view"
  name: string
  description: string
  enabled: boolean
}

export type SiteSettings = {
  pages: ManagedPage[]
  features: ManagedFeature[]
}

export const defaultSiteSettings: SiteSettings = {
  pages: [
    { id: "home", name: "Home", path: "/", enabled: true },
    { id: "map", name: "Map", path: "/map", enabled: true },
    { id: "locate", name: "Locate", path: "/locate", enabled: true },
    { id: "categorize", name: "Categorize", path: "/categorize", enabled: true },
    { id: "reports", name: "Reports", path: "/reports", enabled: true },
  ],
  features: [
    {
      id: "heatmap",
      name: "Heatmap",
      description: "Show the heatmap toggle and load heatmap overlays on the map.",
      enabled: true,
    },
    {
      id: "capture-view",
      name: "Capture View",
      description: "Allow visitors to download the current map view as an image.",
      enabled: true,
    },
  ],
}

