"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function AppDataWarmup() {
  const pathname = usePathname()
  useEffect(() => {
    if (pathname === "/website-map-integration" || pathname === "/website-map-integration/") return
    if (pathname === "/billboard" || pathname === "/billboard/") return
    let cancelled = false
    void import("@/services/apiService").then(({ prefetchMapAndReportData }) => {
      if (!cancelled) void prefetchMapAndReportData()
    }).catch(() => {})
    return () => { cancelled = true }
  }, [pathname])

  return null
}
