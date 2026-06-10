"use client"

import { useEffect, useState } from "react"
import { defaultSiteSettings, type SiteSettings } from "@/lib/site-settings"

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings)

  useEffect(() => {
    let active = true

    fetch("/api/site-settings", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Unable to load site settings."))))
      .then((data: SiteSettings) => {
        if (active) setSettings(data)
      })
      .catch((error) => console.error(error))

    return () => {
      active = false
    }
  }, [])

  return settings
}
