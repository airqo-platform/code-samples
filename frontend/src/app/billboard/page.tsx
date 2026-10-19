import { Suspense } from "react"
import Billboard from "@/components/billboard/Billboard"
import Loading from "@/app/Loading"

export const metadata = { title: "Live Billboard | AirQo", description: "Share air quality, forecasts and weather on a screen that everyone can read." }

export default function BillboardPage() {
  return <Suspense fallback={<Loading />}><Billboard /></Suspense>
}
