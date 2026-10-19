import { useEffect, useState } from "react"
import type L from "leaflet"
import type { TemperatureField } from "@/lib/temperature-field"
import { weatherViewportQuery } from "./weather-viewport"

const TTL = 15 * 60 * 1000
const cache = new Map<string, { fetched: number; field: TemperatureField }>()
let cooldownUntil = 0
const cooldownMessage = () => `Weather provider request limit reached. Retry after ${new Date(cooldownUntil).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}.`

export function useTemperatureField(map: L.Map, enabled: boolean) {
  const [field, setField] = useState<TemperatureField | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!enabled) { setField(null); setError(null); setLoading(false); return }
    let active = true
    let generation = 0
    let controller: AbortController | null = null
    let debounce: ReturnType<typeof setTimeout>
    const load = async () => {
      const version = ++generation
      controller?.abort()
      const key = weatherViewportQuery(map)
      const cached = cache.get(key)
      setError(null)
      if (cached && Date.now() - cached.fetched < TTL) {
        setField(cached.field)
        setLoading(false)
        return
      }
      if (Date.now() < cooldownUntil) {
        setField(null)
        setError(cooldownMessage())
        setLoading(false)
        return
      }
      const request = new AbortController()
      controller = request
      const timeout = setTimeout(() => request.abort(), 30_000)
      setLoading(true)
      try {
        const response = await fetch(`/api/temperature?${key}`, { signal: request.signal })
        if (response.status === 429) {
          const seconds = Number(response.headers.get("retry-after"))
          cooldownUntil = Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000
          if (active && generation === version) {
            setField(null)
            setError(cooldownMessage())
          }
          return
        }
        if (!response.ok) throw new Error("Temperature unavailable")
        const next: TemperatureField = await response.json()
        if (!active || generation !== version) return
        if (cache.size >= 12) cache.delete(cache.keys().next().value!)
        cache.set(key, { field: next, fetched: Date.now() })
        setField(next)
      } catch {
        if (!active || generation !== version) return
        setField(null)
        setError("Temperature data is unavailable. Please try again.")
      } finally {
        clearTimeout(timeout)
        if (active && generation === version) setLoading(false)
      }
    }
    const schedule = () => {
      generation++
      controller?.abort()
      clearTimeout(debounce)
      debounce = setTimeout(load, 400)
    }
    const onVisible = () => { if (!document.hidden) schedule() }
    void load()
    map.on("moveend resize", schedule)
    const refresh = setInterval(onVisible, TTL)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      active = false
      controller?.abort()
      clearTimeout(debounce)
      clearInterval(refresh)
      map.off("moveend resize", schedule)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [map, enabled, attempt])
  return { field, loading, error, retry: () => setAttempt((value) => value + 1) }
}
