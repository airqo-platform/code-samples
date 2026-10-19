"use client"

import * as Select from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { countryFlagUrl, type BillboardGrid } from "@/lib/billboard-grids"

function CountryLabel({ country }: { country: BillboardGrid }) {
  const flag = countryFlagUrl(country)
  return <span className="inline-flex items-center gap-3">{flag && <img src={flag} alt="" width={24} height={16} className="h-4 w-6 rounded-sm object-cover" loading="lazy" />}<span>{(country.long_name || country.name).replace(/_/g, " ")}</span></span>
}

export default function CountryPicker({ countries, value, onChange }: { countries: BillboardGrid[]; value: string; onChange: (id: string) => void }) {
  return <Select.Root value={value} onValueChange={onChange}>
    <Select.Trigger id="country-select" className="flex min-h-12 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
      <Select.Value placeholder="Choose a country" /><Select.Icon><ChevronDown size={18} /></Select.Icon>
    </Select.Trigger>
    <Select.Portal><Select.Content position="popper" sideOffset={6} className="z-[20000] max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-xl">
      <Select.ScrollUpButton className="py-1 text-center">▴</Select.ScrollUpButton>
      <Select.Viewport>{countries.map(country => <Select.Item key={country._id} value={country._id} className="relative flex cursor-pointer items-center rounded-lg py-3 pl-9 pr-4 outline-none data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-800">
        <Select.ItemIndicator className="absolute left-3"><Check size={16} /></Select.ItemIndicator><Select.ItemText><CountryLabel country={country} /></Select.ItemText>
      </Select.Item>)}</Select.Viewport>
      <Select.ScrollDownButton className="py-1 text-center">▾</Select.ScrollDownButton>
    </Select.Content></Select.Portal>
  </Select.Root>
}
