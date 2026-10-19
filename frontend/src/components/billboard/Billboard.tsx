"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import "./billboard.css"
import dynamic from "next/dynamic"
import Loading from "@/app/Loading"
import QuickPlaces, { useFavourites } from "./QuickPlaces"
import { gridsWithinCountry, loadBillboardGrids, type BillboardGrid } from "@/lib/billboard-grids"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Copy, Maximize, Monitor, Pause, Play } from "lucide-react"
import { BILLBOARD_REFRESH_MS, billboardScanUrl, category, categoryImage, hasPm25, latestReadings, type BillboardData, type Period } from "@/lib/billboard"

const RealisticScene = dynamic(() => import("./RealisticScene"), { loading: () => <div className="h-60" /> })
const ActivityScene = dynamic(() => import("./ActivityScene"), { loading: () => <div className="h-60" /> })
const CountryPicker = dynamic(() => import("./CountryPicker"))
const ScanBillboard = dynamic(() => import("./ScanBillboard"))

const field = "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-medium hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
function value(n: number | null | undefined, unit = "") { return typeof n === "number" && Number.isFinite(n) ? `${n.toFixed(1)}${unit}` : "—" }
function stamp(time: string) { const d = new Date(time); return Number.isFinite(d.getTime()) ? d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Time unavailable" }

function Face({ pm, large = false }: { pm: number | null | undefined; large?: boolean }) {
  const src = (categoryImage(pm) || "/images/Invalid.png").replace("/images/", "/images/billboard/faces/").replace(".png", ".webp")
  return <img src={src} alt={category(pm).label} width={large ? 250 : 48} height={large ? 260 : 48} className={large ? "relative z-10 h-44 w-44 object-contain md:h-56 md:w-56" : "h-12 w-12 object-contain"} />
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
  const [countryId, setCountryId] = useState("")
  const [title, setTitle] = useState("")
  const [editingTitle, setEditingTitle] = useState(false)
  function editTitle() { setTitle(params.get("title")?.slice(0, 100) || ""); setEditingTitle(true) }
  const { saved: favourites, toggle: toggleFavourite } = useFavourites()
  const [query, setQuery] = useState("")
  const [grids, setGrids] = useState<BillboardGrid[]>([])
  const [gridError, setGridError] = useState("")
  const [data, setData] = useState<BillboardData | null>(null)
  const [loading, setLoading] = useState(display)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [origin, setOrigin] = useState("")
  const [index, setIndex] = useState(0)
  const [day, setDay] = useState(0)
  const [rotate, setRotate] = useState(true)
  const [now, setNow] = useState(0)
  const [theme, setTheme] = useState("navy")
  const [visual, setVisual] = useState("faces")
  const [preferredActivity, setPreferredActivity] = useState("running")
  useEffect(() => {
    setVisual(params.get("visual") === "realistic" ? "realistic" : params.get("visual") === "activities" ? "activities" : "faces")
    const choice = params.get("activity")
    setPreferredActivity(choice === "football" || choice === "yoga" ? choice : "running")
  }, [params])
  function changeVisual(key: "visual" | "activity", choice: string) {
    if (key === "visual") setVisual(choice); else setPreferredActivity(choice)
    const address = new URL(window.location.href)
    address.searchParams.set(key, choice)
    window.history.replaceState(null, "", address)
  }
  const [nativeFullscreen, setNativeFullscreen] = useState(false)
  const [presentation, setPresentation] = useState(false)
  const isFullscreen = nativeFullscreen || presentation
  const billboardRef = useRef<HTMLDivElement>(null)
  const contentViewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentScale, setContentScale] = useState(1)
  useEffect(() => {
    if (!isFullscreen) { setContentScale(1); return }
    const viewport = contentViewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return
    const fit = () => {
      if (!viewport.clientWidth || !viewport.clientHeight) return
      // Reflow at each scale so the content fills the screen's width too.
      let lower = 0.1
      let upper = 2
      for (let step = 0; step < 16; step++) {
        const scale = (lower + upper) / 2
        content.style.width = `${100 / scale}%`
        if (content.scrollHeight * scale <= viewport.clientHeight && content.scrollWidth * scale <= viewport.clientWidth + 1) lower = scale
        else upper = scale
      }
      content.style.width = `${100 / lower}%`
      setContentScale(lower)
    }
    const observer = new ResizeObserver(fit)
    observer.observe(viewport)
    observer.observe(content)
    fit()
    return () => { observer.disconnect(); content.style.width = "" }
  }, [isFullscreen])
  useEffect(() => {
    const requested = params.get("theme")
    let saved: string | null = null
    try { saved = localStorage.getItem("airqo-billboard-theme") } catch {}
    const choice = requested || saved
    setTheme(choice === "light" || choice === "forest" ? choice : "navy")
  }, [params])
  useEffect(() => {
    const changed = () => setNativeFullscreen(Boolean(billboardRef.current && document.fullscreenElement === billboardRef.current))
    document.addEventListener("fullscreenchange", changed)
    return () => document.removeEventListener("fullscreenchange", changed)
  }, [])
  useEffect(() => {
    if (!presentation) return
    const previousFocus = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    billboardRef.current?.focus()
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setPresentation(false) }
    document.addEventListener("keydown", escape)
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", escape); previousFocus?.focus() }
  }, [presentation])
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
    loadBillboardGrids(controller.signal).then(setGrids).catch(() => { if (!controller.signal.aborted) setGridError("Could not load places. Please reload to try again.") })
    return () => controller.abort()
  }, [display])
  useEffect(() => {
    if (!display) return
    const controller = new AbortController()
    setLoading(true)
    setData(null)
    setError("")
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
        if (!controller.signal.aborted) { setData(body); setError(""); setNow(Date.now()) }
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Unable to refresh data.") }
      finally { busy = false; if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    const timer = setInterval(() => { setNow(Date.now()); void load() }, BILLBOARD_REFRESH_MS)
    return () => { controller.abort(); clearInterval(timer) }
  }, [display, gridId, cohortId])
  const readings = useMemo(() => new Map(Array.from(latestReadings(data?.measurements || [])).filter(([, reading]) => hasPm25(reading.pm2_5?.value))), [data])
  const sites = useMemo(() => {
    const map = new Map<string, string>()
    readings.forEach((r, key) => map.set(key, r.siteDetails?.description || r.siteDetails?.name || `Location ${key}`))
    for (const s of (data?.daily || [])) if (s.site_details?.site_id && map.has(s.site_details.site_id)) map.set(s.site_details.site_id, s.site_details.site_name || map.get(s.site_details.site_id) || s.site_details.site_id)
    return Array.from(map, ([siteId, name]) => ({ siteId, name }))
  }, [data, readings])
  useEffect(() => {
    if (!rotate || sites.length < 2) return
    const timer = setInterval(() => { setIndex(i => (i + 1) % sites.length); setDay(0) }, 15000)
    return () => clearInterval(timer)
  }, [rotate, sites.length])
  const site = sites[index % Math.max(sites.length, 1)]
  const reading = site ? readings.get(site.siteId) : undefined
  const stale = !reading?.time || now - Date.parse(reading.time) > 3 * 3600000
  const current = category(reading?.pm2_5?.value)
  const today = new Date(now || Date.now())
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  const daily = useMemo(() => (data?.daily.find(s => s.site_details?.site_id === site?.siteId)?.forecasts || []).filter(p => p.date && p.date >= localDate && hasPm25(p.forecast?.pm2_5_mean)).sort((a,b) => a.date!.localeCompare(b.date!)).slice(0,7), [data, site?.siteId, localDate])

  const selected = daily[day] || daily[0]
  const met = selected?.met
  const valid = /^[A-Za-z0-9_-]{1,128}$/.test(id)
  const chosenGrid = grids.find(g => g._id === id)
  const countries = useMemo(() => grids.filter(g => g.admin_level?.toLowerCase() === "country"), [grids])
  const selectedCountry = countries.find(g => g._id === countryId)
  const countryGrids = useMemo(() => selectedCountry ? gridsWithinCountry(grids, selectedCountry) : [], [grids, selectedCountry])
  const url = `${origin}/billboard?${new URLSearchParams({ [`${scope}_id`]: id, theme, visual, activity: preferredActivity, ...(title.trim() || chosenGrid?.name ? { title: title.trim() || chosenGrid!.long_name || chosenGrid!.name } : {}) })}`
  const scanUrl = billboardScanUrl(origin, gridId ? "grid" : "cohort", gridId || cohortId || "")
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setStatus("Copied to clipboard.") } catch { setStatus("Clipboard unavailable. Copy the link below manually.") }
  }
  async function fullscreen() {
    if (presentation) { setPresentation(false); return }
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await billboardRef.current?.requestFullscreen() }
    catch { setPresentation(true) }
  }
  if (display && loading) return <Loading />

  return <main className="min-h-screen bg-[#f4f7fb] text-slate-900 [font-family:var(--font-geist-sans)]">
    <div className="mx-auto max-w-[1600px] px-5 py-7 md:px-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-700"><img src="/images/logo_rus4my.webp" alt="AirQo" width={44} height={44} className="h-11 w-11 object-contain" /><span className="billboard-live ml-2 border-l border-slate-300 pl-3 text-sm font-medium text-slate-500">LIVE BILLBOARD</span></Link>
        <div className="flex flex-wrap items-center gap-2"><label htmlFor="billboard-theme" className="text-sm font-medium">Theme</label><select id="billboard-theme" value={theme} onChange={e => changeTheme(e.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500"><option value="navy">Navy</option><option value="light">Light</option><option value="forest">Forest</option></select><label htmlFor="billboard-visual" className="ml-2 text-sm font-medium">Illustration</label><select id="billboard-visual" value={visual} onChange={e => changeVisual("visual", e.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"><option value="faces">Category faces</option><option value="activities">Activity scenes</option><option value="realistic">Realistic animations</option></select>{visual === "activities" && <><label htmlFor="billboard-activity" className="text-sm font-medium">Good-air activity</label><select id="billboard-activity" value={preferredActivity} onChange={e => changeVisual("activity", e.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"><option value="running">Running</option><option value="football">Football</option><option value="yoga">Yoga</option></select></>}{display ? <><Link href="/billboard" className={button}><ArrowLeft size={16} /> Create a billboard</Link><button className={button} onClick={() => copy(window.location.href)}><Copy size={16} /> Copy link</button><button className={button} disabled={!sites.length} onClick={fullscreen}><Maximize size={16} /> Fullscreen</button></> : <Link href="/" className={button}>Back to home</Link>}</div>
      </header>
      {!display ? <div className="mx-auto max-w-5xl py-8">
        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">Better air starts with awareness</span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">Your place. Your air.<br /><span className="text-blue-600">On the big screen.</span></h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">Turn air quality, forecasts and weather into a clear, shareable display for your next discussion, reception screen or community event.</p>
        <div className="mt-10 grid gap-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:grid-cols-2 md:p-9">
          <div className="space-y-5">
            <div className="flex gap-2" aria-label="Data source">{["grid", "cohort"].map(s => <button key={s} aria-pressed={scope === s} onClick={() => { setScope(s); setId(""); setCountryId(""); setQuery(""); setStatus("") }} className={`${button} flex-1 ${scope === s ? "!border-blue-600 bg-blue-50 text-blue-700" : ""}`}>{s === "grid" ? "City / grid" : "Organisation / cohort"}</button>)}</div>
            {scope === "grid" ? <>
              <QuickPlaces grids={grids} countries={countries} place={chosenGrid} country={selectedCountry} saved={favourites} toggle={toggleFavourite} onSelect={(place, country) => { setCountryId(country); setId(place); setQuery(""); setStatus("") }} />
              <label className="block font-medium" htmlFor="country-select">Country</label>
              <CountryPicker countries={countries} value={countryId} favourites={favourites?.map(f => f.id)} onFavourite={country => toggleFavourite(country, country)} onChange={country => { setCountryId(country); setId(country); setQuery(""); setStatus("") }} />
              {selectedCountry && <>
                <p className="text-sm text-slate-500">You can open the billboard for all of {selectedCountry.long_name || selectedCountry.name}, or narrow it to a grid below.</p>
                <label className="block font-medium" htmlFor="place-search">Find a grid <span className="text-slate-400">(optional)</span></label>
                <input id="place-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search within this country" className={field} />
                <label className="block font-medium" htmlFor="grid-select">Grid <span className="text-slate-400">(optional)</span></label>
                <CountryPicker id="grid-select" countries={[{ ...selectedCountry, long_name: `All of ${selectedCountry.long_name || selectedCountry.name}` }, ...countryGrids.filter(g => `${g.name} ${g.long_name || ""}`.toLowerCase().includes(query.toLowerCase()) || g._id === id)]} value={id} favourites={favourites?.map(f => f.id)} onFavourite={place => toggleFavourite(place, countryId)} onChange={place => { setId(place); setStatus("") }} />
                {!countryGrids.length && <p className="text-sm text-slate-500">No smaller grids are available. You can still open the country billboard.</p>}
              </>}
              {gridError && <p role="alert" className="text-red-700">{gridError}</p>}
            </> : <><label className="block font-medium" htmlFor="cohort-id">Cohort ID</label><input id="cohort-id" value={id} onChange={e => setId(e.target.value.trim())} placeholder="Enter cohort_id" maxLength={128} className={field} /><p className="text-sm text-slate-500">Enter your cohort ID to load its monitoring locations. Locations stay separate, even when a network spans several cities.</p>{id && !valid && <p role="alert" className="text-red-700">Use letters, numbers, underscores or hyphens.</p>}</>}
            <label className="block font-medium" htmlFor="billboard-title">Display title <span className="text-slate-400">(optional)</span></label><input id="billboard-title" maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder={chosenGrid?.long_name || chosenGrid?.name || "Our air quality network"} className={field} />
            <div className="flex flex-wrap gap-2"><a aria-disabled={!valid} href={valid ? url : undefined} className={`${button} !border-blue-600 bg-blue-600 !text-white hover:!bg-blue-700 ${!valid ? "pointer-events-none opacity-40" : ""}`}><Monitor size={17} /> Open billboard</a><button className={button} disabled={!valid || !origin} onClick={() => copy(url)}>Copy link</button><button className={button} disabled={!valid || !origin} onClick={() => copy(`<iframe src="${url.replace(/&/g, "&amp;")}" title="AirQo live air quality billboard" style="width:100%;height:760px;border:0" loading="lazy" allow="fullscreen"></iframe>`)}>Copy embed</button></div>
            {valid && <input aria-label="Shareable billboard URL" readOnly value={url} className={`${field} text-xs`} />}
            {valid && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><ScanBillboard url={billboardScanUrl(origin, scope === "grid" ? "grid" : "cohort", id)} downloadable /></div>}
          </div>
          <div data-theme={theme} className="billboard-surface flex flex-col justify-center rounded-2xl bg-[var(--billboard-bg)] p-7 text-[var(--billboard-text)]"><span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--billboard-accent)]">Made for shared screens</span><div className="relative my-6 flex justify-center"><img src="/images/billboard/realistic/moderate-5.webp" alt="Woman checking air quality updates on her phone" width={360} height={360} className="h-60 w-full object-contain" /></div><h2 className="text-2xl font-bold">Make the air visible.</h2><p className="mt-3 leading-relaxed text-[var(--billboard-muted)]">Named monitoring locations. Clear health guidance. Seven-day forecasts with weather. A link that stays up to date.</p><p className="mt-6 text-sm text-[var(--billboard-soft)]">Data refreshes every 60 minutes. Forecasts need Premium API access.</p></div>
        </div>
      </div> : <>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div className="min-w-0"><p className="text-sm font-semibold uppercase tracking-widest text-blue-600">{cohortId ? "Network air quality" : "Local air quality"}</p><h1 tabIndex={0} title="Double-click to edit the title, or press Enter" onDoubleClick={editTitle} onKeyDown={event => { if (event.key === "Enter" || event.key === "F2") { event.preventDefault(); editTitle() } }} className="mt-2 cursor-text break-words rounded-lg text-3xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:text-5xl">{params.get("title")?.slice(0,100) || (gridId ? "Air quality in your area" : "Air quality network")}</h1></div><p className="text-sm text-slate-500">Refreshes every 60 minutes · Times in your browser’s timezone</p></div>
        {editingTitle && <form className="mb-6 flex flex-wrap items-end gap-3" onSubmit={event => {
          event.preventDefault()
          const address = new URL(window.location.href)
          if (title.trim()) address.searchParams.set("title", title.trim().slice(0, 100)); else address.searchParams.delete("title")
          window.history.replaceState(null, "", address)
          setEditingTitle(false)
        }}><div className="min-w-0 flex-1"><label htmlFor="live-billboard-title" className="mb-2 block text-sm font-medium">Display title</label><input autoFocus id="live-billboard-title" maxLength={100} value={title} onChange={event => setTitle(event.target.value)} placeholder="Enter a city or display title" className={field} /></div><button type="submit" className={button}>Save title</button><button type="button" className={button} onClick={() => setEditingTitle(false)}>Cancel</button></form>}
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-800">{error} {data ? "Previously loaded data is shown below." : ""}</p>}
        {data && <>
          <div className="mb-5 flex flex-wrap items-center gap-3"><label htmlFor="location" className="font-semibold">Monitoring location</label><select id="location" className={`${field} !w-auto max-w-full`} value={site?.siteId || ""} onChange={e => { setIndex(sites.findIndex(s => s.siteId === e.target.value)); setDay(0); setRotate(false) }}>{sites.map(s => <option key={s.siteId} value={s.siteId}>{s.name}</option>)}</select>{sites.length > 1 && <button onClick={() => setRotate(!rotate)} className={button}>{rotate ? <Pause size={16} /> : <Play size={16} />}{rotate ? "Pause rotation" : "Resume rotation"}</button>}<span className="text-sm text-slate-500">{sites.length} locations with available data</span></div>
          {!sites.length && <p className="rounded-xl bg-white p-8">No monitoring data is available for this selection.</p>}
          {sites.length > 0 && <>
            <div ref={billboardRef} data-theme={theme} aria-label="Air Quality Live" tabIndex={-1} className={`billboard-surface ${presentation ? "is-presenting" : ""} overflow-hidden rounded-3xl bg-[var(--billboard-bg)] text-[var(--billboard-text)] shadow-xl shadow-slate-300/40`} style={{ border: `1px solid ${current.color}80` }}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--billboard-line)] px-6 py-4">
                <span className="flex items-center gap-2 text-sm font-bold tracking-wider"><img src="/images/logo_rus4my.webp" alt="AirQo" width={44} height={44} className="h-11 w-11 rounded-lg bg-white object-contain" /><span className="billboard-live font-normal text-[var(--billboard-muted)]">AIR QUALITY LIVE</span></span>
                <h2 className={isFullscreen ? "min-w-0 flex-1 break-words text-center text-3xl font-bold leading-tight text-[var(--billboard-accent)] md:text-5xl" : "text-xs font-semibold uppercase tracking-[0.2em] text-[var(--billboard-accent)]"}>{isFullscreen ? params.get("title")?.trim().slice(0, 100) || site?.name : "Air quality in motion"}</h2>
                <div className="flex items-center gap-4"><span className="text-xs text-[var(--billboard-muted)]">{params.get("title")?.slice(0,100)}{params.get("title") ? " | " : ""}Location {(index % sites.length) + 1} / {sites.length}</span>{isFullscreen && <button onClick={fullscreen} className="rounded-lg border border-[var(--billboard-line)] px-3 py-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-[var(--billboard-accent)]">Exit fullscreen</button>}</div>
              </div>
              <div ref={contentViewportRef} className="billboard-content">
              <div ref={contentRef} className="flow-root origin-top-left" style={isFullscreen ? { width: `${100 / contentScale}%`, transform: `scale(${contentScale})` } : undefined}>
              <div className="grid items-center gap-6 px-6 py-6 md:grid-cols-[1.5fr_1fr] md:px-8">
                <section>
                  <p className="text-xs font-medium uppercase tracking-widest text-[var(--billboard-accent)]">{stale ? "Latest available reading" : "Air quality now"}</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{site?.name}</h2>
                  <div className="mt-4 flex flex-wrap items-center gap-4"><p><span className="text-5xl font-bold tabular-nums md:text-6xl">{value(reading?.pm2_5?.value)}</span><span className="ml-2 text-sm text-[var(--billboard-muted)]">µg/m³ PM₂.₅</span></p><span className="max-w-64 rounded-full px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: current.color }}>{current.label}</span></div>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--billboard-text)]">{stale ? "Check recent local air quality updates before planning outdoor activity." : current.action}</p>
                  {selected && <div className="mt-3 border-l-2 border-[var(--billboard-accent)] pl-3"><p className="text-xs font-semibold text-[var(--billboard-accent)]">Forecast recommendation - {selected.date}</p><p className="mt-1 text-sm leading-relaxed text-[var(--billboard-muted)]">{selected.aqi?.label || category(selected.forecast.pm2_5_mean).action}</p></div>}
                  <p className="mt-3 text-xs text-[var(--billboard-soft)]">{reading?.time ? `Measured ${stamp(reading.time)}` : "No current reading available"}</p>
                </section>
                <div className="relative flex min-h-64 items-center justify-center overflow-hidden" aria-label="Air quality category illustration">
                  <div aria-hidden="true" className="billboard-halo absolute h-52 w-52 rounded-full border-2 opacity-70 md:h-60 md:w-60" style={{ borderColor: current.color, boxShadow: `0 0 50px ${current.color}60, inset 0 0 40px ${current.color}30` }} />
                  <>{visual === "realistic" ? <RealisticScene pm={reading?.pm2_5?.value} /> : visual === "activities" ? <ActivityScene pm={reading?.pm2_5?.value} preferred={preferredActivity} /> : <Face pm={reading?.pm2_5?.value} large />}</>
                </div>
              </div>
              <section className="billboard-week mx-4 mb-4 rounded-2xl border border-[var(--billboard-line)] bg-[var(--billboard-panel)] p-4 md:mx-6">
                <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Your week ahead</h2><span className="text-xs text-[var(--billboard-muted)]">PM₂.₅ forecast · Select a day for weather</span></div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">{daily.map((p, i) => <button key={p.date} aria-pressed={selected === p} onClick={() => setDay(i)} className={`rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--billboard-accent)] ${selected === p ? "border-[var(--billboard-accent)] bg-[var(--billboard-selected)]" : "border-transparent bg-[var(--billboard-card)] hover:bg-[var(--billboard-hover)]"}`}>
                  <p className="text-xs font-semibold text-[var(--billboard-muted)]">{new Date(`${p.date}T12:00:00`).toLocaleDateString([], { weekday: "short", day: "numeric" })}</p>
                  <div className="my-2 flex items-center justify-between gap-1"><Face pm={p.forecast?.pm2_5_mean} /><WeatherGlyph met={p.met} /></div>
                  <p className="text-xl font-bold tabular-nums">{value(p.forecast?.pm2_5_mean)}<span className="ml-1 text-[10px] font-normal text-[var(--billboard-muted)]">µg/m³</span></p>
                  <p className="mt-1 text-[11px] leading-tight text-[var(--billboard-muted)]">{p.aqi?.aqi_category || category(p.forecast?.pm2_5_mean).label}</p>
                </button>)}</div>
                <div className="mt-4 flex flex-col gap-6 border-t border-[var(--billboard-line)] pt-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                {!daily.length ? <p className="py-5 text-[var(--billboard-muted)]">Daily forecast unavailable for this location.</p> : <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--billboard-accent)]">Forecast weather · {selected?.date}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">{[["🌡️ Temperature", value(met?.air_temperature, " °C")], ["💧 Humidity", value(met?.relative_humidity, "%")], ["🌬️ Wind", `${value(met?.wind_speed, " m/s")} ${met?.wind_direction_compass || ""}`], ["🌧️ Rainfall", value(met?.precipitation_amount, " mm")]].map(([label, v]) => <div key={label}><p className="text-xs text-[var(--billboard-muted)]">{label}</p><p className="mt-1 text-lg font-semibold">{v}</p></div>)}</div>
                  {!met && <p className="mt-2 text-xs text-[var(--billboard-soft)]">Weather is unavailable for this forecast.</p>}
                </div>}
                </div>
                <div className="billboard-qr shrink-0 text-[var(--billboard-text)]"><ScanBillboard url={scanUrl} /></div>
                </div>
              </section>
              </div>
              </div>
              <div className="billboard-footer flex flex-wrap items-center justify-between gap-5 border-t border-[var(--billboard-line)] px-6 py-4">
                <div className="billboard-footer-meta flex min-w-0 items-center gap-3">{isFullscreen && sites.length > 1 && <button onClick={() => setRotate(!rotate)} className="w-fit shrink-0 rounded-lg border border-[var(--billboard-line)] px-3 py-2 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[var(--billboard-accent)]">{rotate ? "Pause rotation" : "Resume rotation"}</button>}<p className="text-xs text-[var(--billboard-muted)]">{sites.length > 1 ? `Next location: ${sites[(index + 1) % sites.length]?.name}` : "One location - A clearer view of your air"}</p>
                </div>
                <p className="text-xs font-semibold tracking-widest text-[var(--billboard-muted)]">POWERED BY AIRQO</p>
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
