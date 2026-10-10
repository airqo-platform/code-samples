"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useMap } from "react-leaflet"
import L from "leaflet"
import { ChevronLeft, ChevronRight, LoaderCircle, MapPin, RotateCw, Thermometer, X } from "lucide-react"
import { sampleTemperature, temperatureScale, TEMPERATURE_COLORS } from "@/lib/temperature-field"
import { renderTemperature } from "./temperature-renderer"
import { useTemperatureField } from "./use-temperature-field"

const formatTime = (value: string) => new Date(value).toLocaleString(undefined, {
  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
})

export default function TemperatureLayer({ enabled }: { enabled: boolean }) {
  const map = useMap()
  const { field, loading, error, retry } = useTemperatureField(map, enabled)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [opacity, setOpacity] = useState(0.6)
  const [probe, setProbe] = useState<L.LatLng | null>(null)
  const [pinned, setPinned] = useState<L.LatLng | null>(null)
  const [centre, setCentre] = useState(() => map.getCenter())
  const hour = field ? Math.max(0, field.times.indexOf(selectedTime ?? "")) : 0
  const scale = useMemo<[number, number]>(() => field ? temperatureScale(field) : [0, 40], [field])
  const location = pinned ?? probe ?? centre
  const temperature = field ? sampleTemperature(field, hour, location.lat, location.lng) : null
  const noData = field && !field.temperatures[hour]?.some((value) => value !== null)

  useEffect(() => {
    const control = new L.Control({ position: "bottomright" })
    const element = L.DomUtil.create("div")
    L.DomEvent.disableClickPropagation(element)
    L.DomEvent.disableScrollPropagation(element)
    control.onAdd = () => element
    control.addTo(map)
    setContainer(element)
    return () => { control.remove() }
  }, [map])

  useEffect(() => {
    if (!enabled) { setPinned(null); setProbe(null); return }
    const inspect = (event: L.LeafletMouseEvent) => setProbe(event.latlng)
    const pin = (event: L.LeafletMouseEvent) => setPinned(event.latlng)
    const clear = () => setProbe(null)
    const move = () => { setCentre(map.getCenter()); setProbe(null) }
    move()
    map.on("mousemove", inspect)
    map.on("click", pin)
    map.on("mouseout", clear)
    map.on("moveend", move)
    return () => { map.off("mousemove", inspect); map.off("click", pin); map.off("mouseout", clear); map.off("moveend", move) }
  }, [map, enabled])

  useEffect(() => {
    if (!enabled || !field) return
    return renderTemperature(map, field, hour, scale, opacity)
  }, [map, enabled, field, hour, scale, opacity])

  useEffect(() => {
    if (!enabled || !pinned) return
    const marker = L.circleMarker(pinned, { pane: "markerPane", radius: 6, color: "#fff", weight: 2, fillColor: "#0f172a", fillOpacity: 1, interactive: false }).addTo(map)
    return () => { marker.remove() }
  }, [map, enabled, pinned])

  const changeHour = (index: number) => {
    if (field?.times[index]) setSelectedTime(field.times[index])
  }
  return container && enabled ? createPortal(
    <section aria-label="Temperature map legend" className="mb-3 mr-2 w-80 max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-white/20 bg-slate-950/90 text-white shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 px-4 pt-3 text-sm font-semibold"><Thermometer className="h-4 w-4 text-orange-300" /> Air temperature <span className="ml-auto text-xs font-normal text-slate-300">2 m · °C</span></div>
      <div role="status" className="px-4 pb-2 pt-1 text-xs text-slate-300">
        {loading ? <span className="flex items-center gap-2"><LoaderCircle className="h-3 w-3 animate-spin" /> Loading temperature map…</span> : error ? <span>{error}<button type="button" onClick={retry} className="mt-2 flex items-center gap-1 text-orange-200 underline"><RotateCw className="h-3 w-3" /> Retry</button></span> : field ? `Forecast · ${formatTime(field.times[hour])}` : null}
      </div>
      {field && !error && <>
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-3xl font-semibold tracking-tight tabular-nums">{temperature === null ? "—" : `${temperature.toFixed(1)}°C`}</div><div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-300"><MapPin className="h-3 w-3" />{pinned ? "Selected point" : probe ? "At cursor" : "Map centre"}{pinned && <button type="button" aria-label="Clear selected temperature point" onClick={() => setPinned(null)} className="rounded p-1 hover:bg-white/15"><X className="h-3 w-3" /></button>}</div></div>
            <p className="max-w-32 text-right text-[11px] leading-4 text-slate-300">{noData ? "No data for this forecast hour." : temperature === null ? "No forecast at this point." : "Click the map to keep a point selected."}</p>
          </div>
          <div className="mt-3 h-2 rounded-full" style={{ background: `linear-gradient(to right, ${TEMPERATURE_COLORS.map((color) => `rgb(${color.join(",")})`).join(",")})` }} />
          <div className="relative mt-1 h-4 text-[10px] text-slate-300">{TEMPERATURE_COLORS.map((_, index) => <span key={index} className="absolute whitespace-nowrap" style={{ left: `${index / 5 * 100}%`, transform: `translateX(${index === 0 ? 0 : index === 5 ? -100 : -50}%)` }}>{(scale[0] + (scale[1] - scale[0]) * index / 5).toFixed(0)}{index === 5 ? " °C" : ""}</span>)}</div>
          <p className="text-[10px] text-slate-400">Scale for this area, fixed across all forecast hours.</p>
        </div>
        <div className="border-t border-white/10 px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-xs"><label htmlFor="temperature-hour">24-hour forecast</label><button type="button" onClick={() => changeHour(0)} className="text-orange-200 hover:underline">Current hour</button></div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Previous temperature hour" disabled={hour === 0} onClick={() => changeHour(hour - 1)} className="rounded p-1 hover:bg-white/15 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <input id="temperature-hour" type="range" min="0" max={field.times.length - 1} step="1" value={hour} aria-valuetext={formatTime(field.times[hour])} onChange={(event) => changeHour(Number(event.target.value))} className="min-w-0 flex-1 accent-orange-300" />
            <button type="button" aria-label="Next temperature hour" disabled={hour === field.times.length - 1} onClick={() => changeHour(hour + 1)} className="rounded p-1 hover:bg-white/15 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-300"><label htmlFor="temperature-opacity">Opacity</label><input id="temperature-opacity" type="range" min="0.15" max="0.85" step="0.05" value={opacity} aria-valuetext={`${Math.round(opacity * 100)} percent`} onChange={(event) => setOpacity(Number(event.target.value))} className="min-w-0 flex-1 accent-orange-300" /><span className="w-7 tabular-nums">{Math.round(opacity * 100)}%</span></div>
          <p className="mt-3 text-[10px] leading-4 text-slate-400">Regional weather forecast; street-level heat islands are not resolved.<br /><a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="text-slate-300 underline">Weather data by Open-Meteo</a></p>
        </div>
      </>}
    </section>, container,
  ) : null
}
