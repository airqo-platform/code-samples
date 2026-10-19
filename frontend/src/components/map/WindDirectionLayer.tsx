"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useMap } from "react-leaflet"
import L from "leaflet"
import { LoaderCircle, Pause, Play, RotateCw, Wind } from "lucide-react"
import { sampleWind, WIND_COLORS, type WindField } from "@/lib/wind-field"
import { renderWind } from "./wind-renderer"
import { weatherViewportQuery } from "./weather-viewport"

const FRESH_FOR = 15 * 60 * 1000
const fields = new Map<string, { field: WindField; fetched: number }>()
const compass = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]

export default function WindDirectionLayer({ enabled }: { enabled: boolean }) {
  const map = useMap()
  const [paused, setPaused] = useState(false)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [field, setField] = useState<WindField | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [readout, setReadout] = useState<string | null>(null)

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setPaused(preference.matches)
    update()
    preference.addEventListener("change", update)
    const control = new L.Control({ position: "bottomright" })
    const element = L.DomUtil.create("div")
    L.DomEvent.disableClickPropagation(element)
    L.DomEvent.disableScrollPropagation(element)
    control.onAdd = () => element
    control.addTo(map)
    setContainer(element)
    // Opening the forecast sidebar changes map size without a window resize.
    let resizeTimer: ReturnType<typeof setTimeout>
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => map.invalidateSize({ pan: false }), 120)
    })
    observer.observe(map.getContainer())
    return () => {
      control.remove()
      preference.removeEventListener("change", update)
      observer.disconnect()
      clearTimeout(resizeTimer)
    }
  }, [map])

  useEffect(() => {
    if (!enabled) {
      setField(null)
      setError(null)
      setLoading(false)
      setReadout(null)
      return
    }
    let active = true
    let controller: AbortController | null = null
    let debounce: ReturnType<typeof setTimeout>
    let generation = 0
    const load = async () => {
      const version = ++generation
      controller?.abort()
      const key = weatherViewportQuery(map)
      const cached = fields.get(key)
      setError(null)
      if (cached && Date.now() - cached.fetched < FRESH_FOR) {
        setField(cached.field)
        setLoading(false)
        return
      }
      controller = new AbortController()
      const signal = controller.signal
      setLoading(true)
      const timeout = setTimeout(() => controller?.signal === signal && controller.abort(), 30_000)
      try {
        const response = await fetch(`/api/wind?${key}`, { signal })
        if (!response.ok) throw new Error("Wind data unavailable")
        const next: WindField = await response.json()
        if (!active || version !== generation) return
        if (fields.size >= 12) fields.delete(fields.keys().next().value!)
        fields.set(key, { field: next, fetched: Date.now() })
        setField(next)
      } catch {
        if (!active || version !== generation) return
        setField(null)
        setError("Wind data is unavailable. Please try again.")
      } finally {
        clearTimeout(timeout)
        if (active && version === generation) setLoading(false)
      }
    }
    const schedule = () => {
      generation++
      controller?.abort()
      clearTimeout(debounce)
      setReadout(null)
      debounce = setTimeout(load, 400)
    }
    void load()
    map.on("moveend resize", schedule)
    const refresh = setInterval(() => { if (!document.hidden) schedule() }, FRESH_FOR)
    const onVisible = () => { if (!document.hidden) schedule() }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      active = false
      controller?.abort()
      clearTimeout(debounce)
      clearInterval(refresh)
      map.off("moveend resize", schedule)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [map, enabled, retry])

  useEffect(() => {
    if (!enabled || !field) return
    return renderWind(map, field, !paused)
  }, [map, enabled, field, paused])

  useEffect(() => {
    if (!enabled || !field) return
    const inspect = (event: L.LeafletMouseEvent) => {
      const wind = sampleWind(field, event.latlng.lat, event.latlng.lng)
      if (!wind) { setReadout(null); return }
      const speed = Math.hypot(wind.u, wind.v)
      const from = (Math.atan2(-wind.u, -wind.v) * 180 / Math.PI + 360) % 360
      setReadout(speed < 0.1 ? "Calm" : `${speed.toFixed(1)} m/s · from ${compass[Math.round(from / 22.5) % 16]}`)
    }
    const clear = () => setReadout(null)
    map.on("mousemove", inspect)
    map.on("click", inspect)
    map.on("mouseout", clear)
    return () => { map.off("mousemove", inspect); map.off("click", inspect); map.off("mouseout", clear) }
  }, [map, enabled, field])

  return container && enabled ? createPortal(
    <div className="mb-3 mr-2 flex max-w-[calc(100vw-32px)] flex-col items-end gap-2">
      {enabled && <div className="w-72 max-w-full overflow-hidden rounded-2xl border border-white/20 bg-slate-950/90 text-white shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Wind className="h-4 w-4 text-sky-300" /> Surface wind <span className="text-xs font-normal text-slate-300">10 m</span></div>
          {field && !error && <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play wind animation" : "Pause wind animation"} className="rounded-full p-2 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>}
        </div>
        <div role="status" className="px-4 pb-2 pt-1 text-xs text-slate-300">
          {loading ? <span className="flex items-center gap-2"><LoaderCircle className="h-3 w-3 animate-spin" /> Loading wind field…</span> : error ? <span>{error} <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-2 flex items-center gap-1 text-sky-300 underline"><RotateCw className="h-3 w-3" /> Retry</button></span> : field ? <span>GFS forecast · {new Date(field.time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span> : null}
        </div>
        {field && !error && <div className="px-4 pb-3">
          <div className="mb-2 text-sm font-medium">{readout ?? "Move over the map to inspect wind"}</div>
          <div className="h-2 rounded-full" style={{ background: `linear-gradient(to right, ${WIND_COLORS.map((stop) => `rgb(${stop.rgb.join(",")}) ${stop.speed / 30 * 100}%`).join(",")})` }} />
          <div className="relative mt-1 h-4 text-[10px] text-slate-300">{[0, 5, 10, 15, 20, 30].map((speed) => <span key={speed} className="absolute whitespace-nowrap" style={{ left: `${speed / 30 * 100}%`, transform: `translateX(${speed === 0 ? 0 : speed === 30 ? -100 : -50}%)` }}>{speed === 30 ? "30 m/s" : speed}</span>)}</div>
          <p className="mt-2 text-[10px] leading-4 text-slate-400">{paused ? "Animation paused. Arrows show wind flow." : "Trails move with the wind. Colour shows speed."}<br />Interpolated forecast · <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="text-slate-300 underline">Weather data by Open-Meteo</a></p>
        </div>}
      </div>}
    </div>, container,
  ) : null
}
