"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Location } from "@/lib/types"
import { SearchField } from "@/components/ui/search-field"

interface PriorityLocationSearchProps {
  onLocationFound: (location: Location) => void
}

interface LocationSuggestion {
  name: string
  lat: number
  lng: number
}

export function PriorityLocationSearch({ onLocationFound }: PriorityLocationSearchProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error("Location search failed")

        const data = await response.json()
        setSuggestions(
          data
            .map((item: any) => ({
              name: item.display_name,
              lat: Number.parseFloat(item.lat),
              lng: Number.parseFloat(item.lon),
            }))
            .filter((item: LocationSuggestion) => Number.isFinite(item.lat) && Number.isFinite(item.lng)),
        )
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([])
        }
      }
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query])

  const addLocation = (location: LocationSuggestion) => {
    onLocationFound({ lat: location.lat, lng: location.lng })
    setQuery("")
    setSuggestions([])
    window.map?.flyTo([location.lat, location.lng], 14, { duration: 0.8 })
    toast({
      title: "Priority location added",
      description: location.name,
    })
  }

  const searchFirstResult = async () => {
    if (!query.trim()) return
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      )
      if (!response.ok) throw new Error("Location search failed")

      const [result] = await response.json()
      const location = result
        ? {
            name: result.display_name,
            lat: Number.parseFloat(result.lat),
            lng: Number.parseFloat(result.lon),
          }
        : null

      if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
        toast({
          title: "Location not found",
          description: "Try another place name.",
          variant: "destructive",
        })
        return
      }

      addLocation(location)
    } catch {
      toast({
        title: "Search failed",
        description: "Unable to search for that location.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const suggestionMap = useMemo(() => {
    const map = new Map<string, LocationSuggestion>()
    suggestions.forEach((s) => map.set(`${s.lat}-${s.lng}`, s))
    return map
  }, [suggestions])

  const searchSuggestions = suggestions.map((s) => ({
    key: `${s.lat}-${s.lng}`,
    label: s.name,
  }))

  return (
    <SearchField
      value={query}
      onChange={setQuery}
      onSubmit={searchFirstResult}
      placeholder="Search for a priority location"
      leadingIcon={MapPin}
      submitLabel="Search for priority location"
      loading={isLoading}
      suggestions={searchSuggestions}
      onSuggestionSelect={(s) => {
        const selected = suggestionMap.get(s.key)
        if (selected) {
          setQuery("")
          setSuggestions([])
          addLocation(selected)
        }
      }}
    />
  )
}
