"use client"

import { useEffect, useMemo, useState } from "react"
import { Star } from "lucide-react"
import { countryFlagUrl, type BillboardGrid } from "@/lib/billboard-grids"

export type Favourite = { id: string; country: string }
const storageKey = "airqo-billboard-favourites"

export function useFavourites() {
  const [saved, setSaved] = useState<Favourite[] | null>(null)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return
      const value = JSON.parse(stored)
      if (Array.isArray(value)) setSaved(value.filter(item => item && typeof item.id === "string" && typeof item.country === "string").slice(0, 5))
    } catch {}
  }, [])
  function toggle(id: string, country: string) {
    const next = saved?.some(item => item.id === id) ? saved.filter(item => item.id !== id) : [{ id, country }, ...(saved || [])].slice(0, 5)
    setSaved(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
  }
  return { saved, toggle }
}

export default function QuickPlaces({ grids, countries, place, country, onSelect, saved, toggle }: { grids: BillboardGrid[]; countries: BillboardGrid[]; place?: BillboardGrid; country?: BillboardGrid; onSelect: (id: string, country: string) => void; saved: Favourite[] | null; toggle: (id: string, country: string) => void }) {
  const [zone, setZone] = useState("")
  useEffect(() => { setZone(Intl.DateTimeFormat().resolvedOptions().timeZone) }, [])
  const defaults = useMemo(() => {
    if (saved !== null) return []
    const regions = {
      east: ["kenya", "uganda", "ethiopia", "rwanda", "burundi"],
      west: ["ghana", "nigeria", "senegal", "gambia", "cameroon"],
      south: ["south africa", "mozambique", "zambia", "rwanda", "uganda"],
    }
    const region = /Accra|Lagos|Dakar|Banjul|Abidjan|Douala/.test(zone) ? regions.west : /Johannesburg|Maputo|Lusaka|Harare|Windhoek/.test(zone) ? regions.south : regions.east
    const home: Record<string, string> = { Kampala: "uganda", Nairobi: "kenya", Kigali: "rwanda", Bujumbura: "burundi", Addis_Ababa: "ethiopia", Accra: "ghana", Lagos: "nigeria", Dakar: "senegal", Banjul: "gambia", Douala: "cameroon", Johannesburg: "south africa", Maputo: "mozambique", Lusaka: "zambia", Kinshasa: "democratic republic of the congo", Lubumbashi: "democratic republic of the congo", Antananarivo: "madagascar" }
    const order = [home[zone.split("/").pop() || ""], ...region]
    const rank = (g: BillboardGrid) => { const i = order.indexOf(g.name.toLowerCase()); return i < 0 ? order.length : i }
    return [...countries].sort((a, b) => rank(a) - rank(b)).slice(0, 5).map(g => ({ id: g._id, country: g._id }))
  }, [countries, zone, saved])
  const shortcuts = (saved ?? defaults).filter((item, index, all) =>
    all.findIndex(other => other.id === item.id) === index && grids.some(g => g._id === item.id) && countries.some(g => g._id === item.country)
  ).slice(0, 5)
  const favourite = saved?.some(item => item.id === place?._id)
  return <section aria-label="Quick places" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">Your quick places</p>{place && country && <button type="button" onClick={() => toggle(place._id, country._id)} aria-pressed={Boolean(favourite)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"><Star size={16} fill={favourite ? "currentColor" : "none"} />{favourite ? "Remove favourite" : "Save favourite"}</button>}</div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{shortcuts.map(item => {
      const grid = grids.find(g => g._id === item.id)!
      const flag = countryFlagUrl(countries.find(g => g._id === item.country)!)
      return <button key={item.id} type="button" aria-pressed={place?._id === item.id} onClick={() => onSelect(item.id, item.country)} className={`relative flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-500 ${place?._id === item.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 hover:bg-slate-50"}`}>
        {flag && <img src={flag} alt="" width={32} height={22} className="h-[22px] w-8 rounded-sm object-cover" />}
        <span className="w-full break-words text-center">{(grid.long_name || grid.name).replace(/_/g, " ")}</span>
        {saved?.some(saved => saved.id === item.id) && <Star aria-label="Favourite" size={10} fill="currentColor" className="absolute right-1 top-1 text-blue-600" />}
      </button>
    })}</div>
    <p className="text-xs text-slate-500">{saved === null ? "Suggested for your timezone. Save a favourite to replace these suggestions." : "Only your saved favourites appear here."} Save up to five countries or cities. Remembered in this browser.</p>
  </section>
}
