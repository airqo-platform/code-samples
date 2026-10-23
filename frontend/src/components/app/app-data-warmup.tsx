"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const WARMUP_ROUTES = new Set(["/map", "/map/", "/reports", "/reports/"])

export default function AppDataWarmup() {
  const pathname = usePathname()
  useEffect(() => {
    if (!WARMUP_ROUTES.has(pathname ?? "")) return
    let cancelled = false
    void import("@/lib/api-service").then(({ prefetchMapAndReportData }) => {
      if (!cancelled) void prefetchMapAndReportData()
    }).catch(() => {})
    return () => { cancelled = true }
  }, [pathname])

  return null
}
