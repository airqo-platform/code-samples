"use client"
import type React from "react"
import dynamic from "next/dynamic"
import { AppLoader } from "@/components/layout/app-loader"
import Navigation from "@/components/navigation/navigation"

const LeafletMap = dynamic(() => import("@/components/mapping/leaflet-map"), {
  ssr: false,
  loading: () => <AppLoader />,
})

const MapPage: React.FC = () => {
  return (
    <div className="flex h-[100svh] flex-col bg-background">
      <Navigation />
      <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 px-2 pb-2">
        <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <h1 className="sr-only">Air quality map</h1>
          <LeafletMap />
        </div>
      </main>
    </div>
  )
}

export default MapPage
