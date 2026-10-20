import { Suspense } from "react"
import Billboard from "@/components/billboard/billboard"
import { AppLoader } from "@/components/layout/app-loader"

export const metadata = { title: "Live Billboard | AirQo", description: "Share air quality, forecasts and weather on a screen that everyone can read." }

export default function BillboardPage() {
  return <Suspense fallback={<AppLoader />}><Billboard /></Suspense>
}
