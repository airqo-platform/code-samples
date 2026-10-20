"use client"

import { Spinner } from "@/components/ui/spinner"

export default function ReportLoadingScreen() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 rounded-full bg-card/95 px-4 py-3 shadow-xl ring-1 ring-border">
        <Spinner size="lg" label="Loading report data" className="text-primary" />
      </div>
    </div>
  )
}
