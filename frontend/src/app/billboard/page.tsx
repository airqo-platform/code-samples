import { Suspense } from "react"
import Billboard from "@/components/billboard/billboard"

export const metadata = { title: "Live Billboard | AirQo", description: "Share air quality, forecasts and weather on a screen that everyone can read." }

export default function BillboardPage() {
  return (
    <Suspense
      fallback={
        <main
          id="main-content"
          tabIndex={-1}
          className="flex min-h-screen flex-col bg-background text-foreground"
          role="status"
          aria-live="polite"
          aria-label="Loading air quality billboard"
        >
          <h1 className="sr-only">Air quality billboard</h1>
          <div className="flex flex-1 items-center justify-center">
            <div className="SecondaryMainloader route-loader text-primary" aria-hidden="true" />
          </div>
        </main>
      }
    >
      <Billboard />
    </Suspense>
  )
}
