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
    <div className="flex flex-col min-h-[100svh] h-[100svh]">
      {/* Add Navigation Component */}
      <Navigation />

      {/* Map Container with Fixed Height */}
      <main id="main-content" tabIndex={-1} className="flex-1">
        <h1 className="sr-only">Air quality map</h1>
        <LeafletMap />
      </main>
    </div>
  )
}

export default MapPage
