"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import "./billboard.css"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Copy, Maximize, Monitor, Pause, Play, Wind } from "lucide-react"
import { BILLBOARD_REFRESH_MS, category, categoryImage, latestReadings, type BillboardData, type Period } from "@/lib/billboard"

type Grid = { _id: string; name: string; long_name?: string }
const field = "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-medium hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
function value(n: number | null | undefined, unit = "") { return typeof n === "number" && Number.isFinite(n) ? `${n.toFixed(1)}${unit}` : "—" }
function stamp(time: string) { const d = new Date(time); return Number.isFinite(d.getTime()) ? d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Time unavailable" }

function Face({ pm, large = false }: { pm: number | null | undefined; large?: boolean }) {
  const src = categoryImage(pm)
  // Existing category artwork: each source PNG is only 36-42 KB.
  return src ? <img src={src} alt={category(pm).label} width={large ? 200 : 40} height={large ? 200 : 40} className={large ? "relative z-10 h-36 w-36 object-contain md:h-48 md:w-48" : "h-10 w-10 object-contain"} /> : <span className="text-slate-400" aria-label="Category unavailable">—</span>
}
function WeatherGlyph({ met }: { met: Period["met"] }) {
  const rain = met?.precipitation_amount
  return <span role="img" aria-label={rain == null ? "Weather unavailable" : rain > 0 ? "Rain forecast" : "No rainfall forecast"} className="text-2xl">{rain == null ? "—" : rain > 0 ? "🌧️" : "🌤️"}</span>
}

export default function Billboard() {
  const params = useSearchParams()
  const gridId = params.get("grid_id"), cohortId = params.get("cohort_id")
  const display = Boolean(gridId || cohortId)
  const [scope, setScope] = useState("grid")
  const [id, setId] = useState("")
  const [title, setTitle] = useState("")
  const [query, setQuery] = useState("")
  const [grids, setGrids] = useState<Grid[]>([])
  const [gridError, setGridError] = useState("")
  const [data, setData] = useState<BillboardData | null>(null)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [origin, setOrigin] = useState("")
  const [index, setIndex] = useState(0)
  const [day, setDay] = useState(0)
  const [rotate, setRotate] = useState(false)
  const [now, setNow] = useState(0)
  const [theme, setTheme] = useState("navy")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const billboardRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const requested = params.get("theme")
    let saved: string | null = null
    try { saved = localStorage.getItem("airqo-billboard-theme") } catch {}
    const choice = requested || saved
    setTheme(choice === "light" || choice === "forest" ? choice : "navy")
  }, [params])
  useEffect(() => {
    const changed = () => setIsFullscreen(Boolean(billboardRef.current && document.fullscreenElement === billboardRef.current))
    document.addEventListener("fullscreenchange", changed)
    return () => document.removeEventListener("fullscreenchange", changed)
  }, [])
  function changeTheme(choice: string) {
    setTheme(choice)
    try { localStorage.setItem("airqo-billboard-theme", choice) } catch {}
    const address = new URL(window.location.href)
    address.searchParams.set("theme", choice)
    window.history.replaceState(null, "", address)
  }
  useEffect(() => { setOrigin(window.location.origin); setNow(Date.now()) }, [])
  useEffect(() => {
    if (display) return
    const controller = new AbortController()
    fetch("/api/airqo/devices/grids/summary", { signal: controller.signal }).then(async r => { if (!r.ok) throw Error(); return r.json() }).then(body => {
      const list = body.grids || body.data?.grids
      if (!Array.isArray(list)) throw Error()
      setGrids(list.sort((a: Grid, b: Grid) => a.name.localeCompare(b.name)))
    }).catch(() => { if (!controller.signal.aborted) setGridError("Could not load places. Please reload to try again.") })
    return () => controller.abort()
  }, [display])
  useEffect(() => {
    if (!display) return
    const controller = new AbortController()
    let busy = false
    async function load() {
      if (busy) return
      busy = true
      try {
        const search = new URLSearchParams()
        if (gridId) search.set("grid_id", gridId)
        if (cohortId) search.set("cohort_id", cohortId)
        const response = await fetch(`/api/billboard?${search}`, { signal: controller.signal })
        const body = await response.json()
        if (!response.ok) throw Error(body.message || "Unable to load billboard.")
        setData(body); setError(""); setNow(Date.now())
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Unable to refresh data.") }
      finally { busy = false }
    }
    void load()
    const timer = setInterval(() => { setNow(Date.now()); void load() }, BILLBOARD_REFRESH_MS)
    return () => { controller.abort(); clearInterval(timer) }
  }, [display, gridId, cohortId])
  const readings = useMemo(() => latestReadings(data?.measurements || []), [data])
  const sites = useMemo(() => {
    const map = new Map<string, string>()
    readings.forEach((r, key) => map.set(key, r.siteDetails?.description || r.siteDetails?.name || `Location ${key}`))
    for (const s of (data?.daily || [])) if (s.site_details?.site_id) map.set(s.site_details.site_id, s.site_details.site_name || map.get(s.site_details.site_id) || s.site_details.site_id)
    return Array.from(map, ([siteId, name]) => ({ siteId, name }))
  }, [data, readings])
  useEffect(() => {
    if (!rotate || sites.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = setInterval(() => { setIndex(i => (i + 1) % sites.length); setDay(0) }, 15000)
    return () => clearInterval(timer)
  }, [rotate, sites.length])
  const site = sites[index % Math.max(sites.length, 1)]
  const reading = site ? readings.get(site.siteId) : undefined
  const stale = !reading?.time || now - Date.parse(reading.time) > 3 * 3600000
  const current = category(reading?.pm2_5?.value)
  const today = new Date(now || Date.now())
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  const daily = (data?.daily.find(s => s.site_details?.site_id === site?.siteId)?.forecasts || []).filter(p => p.date && p.date >= localDate).sort((a,b) => a.date!.localeCompare(b.date!)).slice(0,7)

  const selected = daily[day] || daily[0]
  const met = selected?.met
  const valid = /^[A-Za-z0-9_-]{1,128}$/.test(id)
  const chosenGrid = grids.find(g => g._id === id)
  const url = `${origin}/billboard?${new URLSearchParams({ [`${scope}_id`]: id, theme, ...(title.trim() || chosenGrid?.name ? { title: title.trim() || chosenGrid!.name } : {}) })}`
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setStatus("Copied to clipboard.") } catch { setStatus("Clipboard unavailable. Copy the link below manually.") }
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await billboardRef.current?.requestFullscreen() } catch { setStatus("Fullscreen is unavailable in this browser.") }
  }
  return <main className="min-h-screen bg-[#f4f7fb] text-slate-900 [font-family:var(--font-geist-sans)]">
    <div className="mx-auto max-w-[1600px] px-5 py-7 md:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-700"><Wind /> AirQo <span className="ml-2 border-l border-slate-300 pl-3 text-sm font-medium text-slate-500">LIVE BILLBOARD</span></Link>
        <div className="flex flex-wrap items-center gap-2"><label htmlFor="billboard-theme" className="text-sm font-medium">Theme</label><select id="billboard-theme" value={theme} onChange={e => changeTheme(e.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500"><option value="navy">Navy</option><option value="light">Light</option><option value="forest">Forest</option></select>{display ? <><Link href="/billboard" className={button}><ArrowLeft size={16} /> Create a billboard</Link><button className={button} onClick={() => copy(window.location.href)}><Copy size={16} /> Copy link</button><button className={button} disabled={!sites.length} onClick={fullscreen}><Maximize size={16} /> Fullscreen</button></> : <Link href="/" className={button}>Back to home</Link>}</div>
      </header>
      {!display ? <div className="mx-auto max-w-5xl py-8">
        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">Better air starts with awareness</span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">Your place. Your air.<br /><span className="text-blue-600">On the big screen.</span></h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">Turn air quality, forecasts and weather into a clear, shareable display for your next discussion, reception screen or community event.</p>
        <div className="mt-10 grid gap-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:grid-cols-2 md:p-9">
          <div className="space-y-5">
            <div className="flex gap-2" aria-label="Data source">{["grid", "cohort"].map(s => <button key={s} aria-pressed={scope === s} onClick={() => { setScope(s); setId(""); setStatus("") }} className={`${button} flex-1 ${scope === s ? "!border-blue-600 bg-blue-50 text-blue-700" : ""}`}>{s === "grid" ? "City / grid" : "Organisation / cohort"}</button>)}</div>
            {scope === "grid" ? <><label className="block font-medium" htmlFor="place-search">Find a place</label><input id="place-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Gulu, Kampala, Nairobi…" className={field} /><label className="block font-medium" htmlFor="grid-select">Select a grid</label><select id="grid-select" value={id} onChange={e => setId(e.target.value)} className={field}><option value="">Choose a place</option>{grids.filter(g => `${g.name} ${g.long_name || ""}`.toLowerCase().includes(query.toLowerCase()) || g._id === id).map(g => <option key={g._id} value={g._id}>{g.long_name || g.name}</option>)}</select>{gridError && <p role="alert" className="text-red-700">{gridError}</p>}</> : <><label className="block font-medium" htmlFor="cohort-id">Cohort ID</label><input id="cohort-id" value={id} onChange={e => setId(e.target.value.trim())} placeholder="Enter cohort_id" maxLength={128} className={field} /><p className="text-sm text-slate-500">Use a cohort enabled for public sharing. Locations stay separate, even when a network spans several cities.</p>{id && !valid && <p role="alert" className="text-red-700">Use letters, numbers, underscores or hyphens.</p>}</>}
            <label className="block font-medium" htmlFor="billboard-title">Display title <span className="text-slate-400">(optional)</span></label><input id="billboard-title" maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder={chosenGrid?.name || "Our air quality network"} className={field} />
            <div className="flex flex-wrap gap-2"><a aria-disabled={!valid} href={valid ? url : undefined} className={`${button} !border-blue-600 bg-blue-600 !text-white hover:!bg-blue-700 ${!valid ? "pointer-events-none opacity-40" : ""}`}><Monitor size={17} /> Open billboard</a><button className={button} disabled={!valid || !origin} onClick={() => copy(url)}>Copy link</button><button className={button} disabled={!valid || !origin} onClick={() => copy(`<iframe src="${url.replace(/&/g, "&amp;")}" title="AirQo live air quality billboard" style="width:100%;height:760px;border:0" loading="lazy" allow="fullscreen"></iframe>`)}>Copy embed</button></div>
            {valid && <input aria-label="Shareable billboard URL" readOnly value={url} className={`${field} text-xs`} />}
          </div>
          <div data-theme={theme} className="billboard-surface flex flex-col justify-center rounded-2xl bg-[var(--billboard-bg)] p-7 text-[var(--billboard-text)]"><span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--billboard-accent)]">Made for shared screens</span><div className="relative my-6 flex justify-center"><Face pm={8} large /></div><h2 className="text-2xl font-bold">Make the air visible.</h2><p className="mt-3 leading-relaxed text-[var(--billboard-muted)]">Named monitoring locations. Clear health guidance. Seven-day forecasts with weather. A link that stays up to date.</p><p className="mt-6 text-sm text-[var(--billboard-soft)]">Data refreshes every 60 minutes. Forecasts need Premium API access.</p></div>
        </div>
      </div> : <>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-blue-600">{cohortId ? "Network air quality" : "Local air quality"}</p><h1 className="mt-2 text-3xl font-bold md:text-5xl">{params.get("title")?.slice(0,100) || (gridId ? "Air quality in your area" : "Air quality network")}</h1></div><p className="text-sm text-slate-500">Refreshes every 60 minutes · Times in your browser’s timezone</p></div>
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-800">{error} {data ? "Previously loaded data is shown below." : ""}</p>}
        {!data && !error && <p role="status" className="p-10">Loading readings, forecasts and weather…</p>}
        {data && <>
          <div className="mb-5 flex flex-wrap items-center gap-3"><label htmlFor="location" className="font-semibold">Monitoring location</label><select id="location" className={`${field} !w-auto max-w-full`} value={site?.siteId || ""} onChange={e => { setIndex(sites.findIndex(s => s.siteId === e.target.value)); setDay(0); setRotate(false) }}>{sites.map(s => <option key={s.siteId} value={s.siteId}>{s.name}</option>)}</select>{sites.length > 1 && <button onClick={() => setRotate(!rotate)} className={button}>{rotate ? <Pause size={16} /> : <Play size={16} />}{rotate ? "Pause rotation" : "Rotate locations"}</button>}<span className="text-sm text-slate-500">{sites.length} locations with available data</span></div>
          {!sites.length && <p className="rounded-xl bg-white p-8">No monitoring data is available for this selection.</p>}
          {sites.length > 0 && <>
            <div ref={billboardRef} data-theme={theme} aria-label="Air Quality Live" className="billboard-surface overflow-hidden rounded-3xl bg-[var(--billboard-bg)] text-[var(--billboard-text)] shadow-xl shadow-slate-300/40" style={{ border: `1px solid ${current.color}80` }}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--billboard-line)] px-6 py-4">
                <span className="text-sm font-bold tracking-wider">AirQo <span className="ml-2 font-normal text-[var(--billboard-muted)]">| AIR QUALITY LIVE</span></span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--billboard-accent)]">Air quality in motion</span>
                <div className="flex items-center gap-4"><span className="text-xs text-[var(--billboard-muted)]">{params.get("title")?.slice(0,100)}{params.get("title") ? " | " : ""}Location {(index % sites.length) + 1} / {sites.length}</span>{isFullscreen && <button onClick={fullscreen} className="rounded-lg border border-[var(--billboard-line)] px-3 py-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-[var(--billboard-accent)]">Exit fullscreen</button>}</div>
              </div>
              <div className="grid items-center gap-6 px-6 py-6 md:grid-cols-[1.5fr_1fr] md:px-8">
                <section>
                  <p className="text-xs font-medium uppercase tracking-widest text-[var(--billboard-accent)]">{stale ? "Latest available reading" : "Air quality now"}</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{site?.name}</h2>
                  <div className="mt-4 flex flex-wrap items-center gap-4"><p><span className="text-5xl font-bold tabular-nums md:text-6xl">{value(reading?.pm2_5?.value)}</span><span className="ml-2 text-sm text-[var(--billboard-muted)]">µg/m³ PM₂.₅</span></p><span className="max-w-64 rounded-full px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: current.color }}>{current.label}</span></div>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--billboard-text)]">{stale ? "Check recent local air quality updates before planning outdoor activity." : current.action}</p>
                  <p className="mt-3 text-xs text-[var(--billboard-soft)]">{reading?.time ? `Measured ${stamp(reading.time)}` : "No current reading available"}</p>
                </section>
                <div className="relative flex min-h-52 items-center justify-center overflow-hidden" aria-label="Air quality category illustration">
                  <div aria-hidden="true" className="billboard-halo absolute h-44 w-44 rounded-full border-2 opacity-70 md:h-56 md:w-56" style={{ borderColor: current.color, boxShadow: `0 0 50px ${current.color}60, inset 0 0 40px ${current.color}30` }} />
                  <Face pm={reading?.pm2_5?.value} large />
                </div>
              </div>
              <section className="mx-4 mb-4 rounded-2xl border border-[var(--billboard-line)] bg-[var(--billboard-panel)] p-4 md:mx-6">
                <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Your week ahead</h2><span className="text-xs text-[var(--billboard-muted)]">PM₂.₅ forecast · Select a day for weather</span></div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">{daily.map((p, i) => <button key={p.date} aria-pressed={selected === p} onClick={() => setDay(i)} className={`rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--billboard-accent)] ${selected === p ? "border-[var(--billboard-accent)] bg-[var(--billboard-selected)]" : "border-transparent bg-[var(--billboard-card)] hover:bg-[var(--billboard-hover)]"}`}>
                  <p className="text-xs font-semibold text-[var(--billboard-muted)]">{new Date(`${p.date}T12:00:00`).toLocaleDateString([], { weekday: "short", day: "numeric" })}</p>
                  <div className="my-2 flex items-center justify-between gap-1"><Face pm={p.forecast?.pm2_5_mean} /><WeatherGlyph met={p.met} /></div>
                  <p className="text-xl font-bold tabular-nums">{value(p.forecast?.pm2_5_mean)}<span className="ml-1 text-[10px] font-normal text-[var(--billboard-muted)]">µg/m³</span></p>
                  <p className="mt-1 text-[11px] leading-tight text-[var(--billboard-muted)]">{p.aqi?.aqi_category || category(p.forecast?.pm2_5_mean).label}</p>
                </button>)}</div>
                {!daily.length ? <p className="py-5 text-[var(--billboard-muted)]">Daily forecast unavailable for this location.</p> : <div className="mt-4 border-t border-[var(--billboard-line)] pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--billboard-accent)]">Forecast weather · {selected?.date}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">{[["🌡️ Temperature", value(met?.air_temperature, " °C")], ["💧 Humidity", value(met?.relative_humidity, "%")], ["🌬️ Wind", `${value(met?.wind_speed, " m/s")} ${met?.wind_direction_compass || ""}`], ["🌧️ Rainfall", value(met?.precipitation_amount, " mm")]].map(([label, v]) => <div key={label}><p className="text-xs text-[var(--billboard-muted)]">{label}</p><p className="mt-1 text-lg font-semibold">{v}</p></div>)}</div>
                  <p className="mt-3 text-sm text-[var(--billboard-muted)]">{selected?.aqi?.label || category(selected?.forecast?.pm2_5_mean).action}</p>
                  {!met && <p className="mt-2 text-xs text-[var(--billboard-soft)]">Weather is unavailable for this forecast.</p>}
                </div>}
              </section>
              <div className="border-t border-[var(--billboard-line)] px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[var(--billboard-muted)]">{sites.length > 1 ? `Next location: ${sites[(index + 1) % sites.length]?.name}` : "One location · A clearer view of your air"}</p></div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">PM₂.₅ concentration at this monitoring location. This is not a city-wide exposure estimate. Daily category faces describe air quality; weather symbols describe rainfall.</p>
            <style jsx>{`@keyframes halo { 0%, 100% { transform: scale(.94); opacity: .5; } 50% { transform: scale(1.04); opacity: .85; } } .billboard-halo { animation: halo 5s ease-in-out infinite; } @media (prefers-reduced-motion: reduce) { .billboard-halo { animation: none; } }`}</style>
          </>}
          {data.warnings.map(w => <p key={w} className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{w}</p>)}
        </>}
        <footer className="mt-8 flex flex-wrap justify-between gap-3 text-sm text-slate-500"><span>Powered by AirQo · Observations and model forecasts are shown separately.</span><a className="underline" href="https://platform.airqo.net/docs/api/forecasts/overview/" target="_blank" rel="noreferrer">About the data</a></footer>
      </>}
      <p role="status" className="mt-4 text-sm text-blue-700">{status}</p>
    </div>
  </main>
}
