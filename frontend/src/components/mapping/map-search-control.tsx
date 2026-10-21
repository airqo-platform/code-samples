import type React from "react"
import { useEffect, useRef, useState } from "react"
import type L from "leaflet"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { searchPlaces, type SearchPlace } from "@/lib/mapbox-geocoding"

interface MapSearchControlProps {
  map: L.Map | null
  onSelect?: (result: SearchPlace) => void
  onClear?: () => void
  placeholder?: string
  className?: string
}

const DEBOUNCE_MS = 300

export function MapSearchControl({
  map,
  onSelect,
  onClear,
  placeholder = "Search for a place",
  className,
}: MapSearchControlProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchPlace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextSearchRef = useRef(false)

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false
      return
    }
    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
      setIsOpen(false)
      setActiveIndex(-1)
      abortRef.current?.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      return
    }

    setIsLoading(true)
    setIsOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const places = await searchPlaces(query, controller.signal)
        if (controller.signal.aborted) return
        setResults(places)
        setIsOpen(true)
        setActiveIndex(places.length ? 0 : -1)
        setIsLoading(false)
      } catch {
        if (controller.signal.aborted) return
        setResults([])
        setIsOpen(false)
        setIsLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const applySelection = (result: SearchPlace) => {
    if (map) {
      if (result.bounds) {
        map.fitBounds(result.bounds, { padding: [40, 40], animate: true, duration: 1 })
      } else {
        map.flyTo(result.center, 13, { animate: true, duration: 1 })
      }
    }
    onSelect?.(result)
    // Skip the query effect for this programmatic set so the label is not re-searched.
    // Only arm the flag when the value actually changes; otherwise the effect would not
    // re-run and the flag would swallow the next legitimate search.
    skipNextSearchRef.current = result.label !== query
    setQuery(result.label)
    setResults([])
    setIsLoading(false)
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const handleClear = () => {
    skipNextSearchRef.current = false
    setQuery("")
    setResults([])
    setIsLoading(false)
    setIsOpen(false)
    setActiveIndex(-1)
    abortRef.current?.abort()
    onClear?.()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || !results.length) {
      if (event.key === "Enter" && query.trim() && !isLoading) {
        // allow external Enter handling if needed
      }
      return
    }
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault()
        setActiveIndex((prev) => (prev + 1) % results.length)
        break
      }
      case "ArrowUp": {
        event.preventDefault()
        setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1))
        break
      }
      case "Enter": {
        event.preventDefault()
        const target = results[activeIndex] ?? results[0]
        if (target) applySelection(target)
        break
      }
      case "Escape": {
        event.preventDefault()
        setIsOpen(false)
        setActiveIndex(-1)
        break
      }
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-[min(18rem,calc(100vw-2rem))]", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-expanded={isOpen}
          autoComplete="off"
          className="h-10 rounded-md border border-border bg-card pl-9 pr-9 shadow-md text-sm"
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="absolute top-full z-[1200] mt-1 w-full overflow-hidden rounded-md border border-border bg-card p-1 shadow-lg" role="listbox" aria-label="Search results">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground" role="status">
              <Spinner size="sm" label="Searching places" />
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
          ) : (
            <div className="max-h-64 overflow-y-auto" role="presentation">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => applySelection(result)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "w-full rounded-sm px-3 py-2 text-left text-sm",
                    index === activeIndex ? "bg-muted text-foreground" : "text-foreground hover:bg-muted",
                  )}
                >
                  {result.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
