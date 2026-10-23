"use client"

import { useMemo } from "react"
import LeafletMap from "@/components/mapping/leaflet-map"
import { latestReadings, type Reading, type ForecastSite } from "@/lib/billboard"

export default function BillboardMap({ measurements, daily, visible }: { measurements: Reading[]; daily: ForecastSite[]; visible: boolean }) {
  const siteIds = useMemo(() => Array.from(new Set([
    ...latestReadings(measurements).keys(),
    ...daily.map(site => site.site_details.site_id),
  ])), [measurements, daily])
  return <div className="relative min-h-[400px] flex-1">
    <div className="absolute inset-0"><LeafletMap siteIds={siteIds} visible={visible} /></div>
  </div>
}
