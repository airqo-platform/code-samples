"use client"

import * as Select from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp, Star } from "lucide-react"
import { countryFlagUrl, type BillboardGrid } from "@/lib/billboard-grids"

export default function CountryPicker({ countries, value, onChange, id = "country-select", placeholder = "Choose a country", favourites = [], onFavourite }: { countries: BillboardGrid[]; value: string; onChange: (id: string) => void; id?: string; placeholder?: string; favourites?: string[]; onFavourite?: (id: string) => void }) {
  return <Select.Root value={value} onValueChange={onChange}>
    <Select.Trigger id={id} className="flex min-h-12 w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500">
      <Select.Value placeholder={placeholder} /><Select.Icon><ChevronDown size={18} /></Select.Icon>
    </Select.Trigger>
    <Select.Portal><Select.Content position="popper" sideOffset={6} className="z-[20000] max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-card p-1 text-foreground shadow-xl">
      {onFavourite && <p className="px-3 py-2 text-xs text-muted-foreground">Star a place to save it. Keyboard: highlight a place and press *.</p>}
      <Select.ScrollUpButton className="flex justify-center py-1"><ChevronUp size={16} /></Select.ScrollUpButton>
      <Select.Viewport>{countries.map(country => {
        const flag = countryFlagUrl(country)
        const name = (country.long_name || country.name).replace(/_/g, " ")
        const saved = favourites.includes(country._id)
        return <div key={country._id} className="flex items-center">
          <Select.Item value={country._id} onKeyDown={event => { if (event.key === "*" && onFavourite) { event.preventDefault(); onFavourite(country._id) } }} className="relative flex min-w-0 flex-1 cursor-pointer items-center rounded-lg py-3 pl-9 pr-4 outline-none data-[highlighted]:bg-accent data-[highlighted]:text-primary">
            <Select.ItemIndicator className="absolute left-3"><Check size={16} /></Select.ItemIndicator>
            <Select.ItemText><span className="inline-flex items-center gap-3">{flag && <img src={flag} alt="" width={24} height={16} className="h-4 w-6 rounded-sm object-cover" loading="lazy" />}<span>{name}</span></span></Select.ItemText>
          </Select.Item>
          {onFavourite && <button type="button" aria-label={`${saved ? "Remove" : "Save"} ${name} ${saved ? "from" : "as"} favourite`} aria-pressed={saved} onClick={() => onFavourite(country._id)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-accent focus-visible:ring-2 focus-visible:ring-blue-500"><Star size={18} fill={saved ? "currentColor" : "none"} /></button>}
        </div>
      })}</Select.Viewport>
      <Select.ScrollDownButton className="flex justify-center py-1"><ChevronDown size={16} /></Select.ScrollDownButton>
    </Select.Content></Select.Portal>
  </Select.Root>
}
