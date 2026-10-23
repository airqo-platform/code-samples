"use client"

import { LoadingOverlay } from "@/components/ui/loading-overlay"

export default function ReportLoadingScreen() {
  return (
    <LoadingOverlay
      isVisible
      title="Preparing your report"
      description="Loading monitoring sites and generating the report."
    />
  )
}
