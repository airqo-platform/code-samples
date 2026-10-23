"use client"

import type { LucideIcon } from "lucide-react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  leadingIcon?: LucideIcon
  clearable?: boolean
  loading?: boolean
  submitLabel?: string
  suggestions?: { key: string; label: string }[]
  onSuggestionSelect?: (suggestion: { key: string; label: string }) => void
  className?: string
}

export function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder,
  leadingIcon: LeadingIcon,
  clearable = true,
  loading = false,
  submitLabel,
  suggestions = [],
  onSuggestionSelect,
  className,
}: SearchFieldProps) {
  const showSuggestions = suggestions.length > 0

  return (
    <div className={cn("relative w-full", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        className="flex gap-2"
      >
        <div className="relative min-w-0 flex-1">
          {LeadingIcon && (
            <LeadingIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          )}
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "h-10 rounded-md border-input bg-background",
              LeadingIcon ? "pl-9" : "",
              clearable && value ? "pr-9" : "",
            )}
            disabled={loading}
            aria-label={placeholder || submitLabel || "Search"}
          />
          {clearable && value && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-md"
          disabled={loading || !value.trim()}
          aria-label={submitLabel}
        >
          {loading ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
        </Button>
      </form>

      {showSuggestions && (
        <ul className="absolute z-[1200] mt-2 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-card p-1 shadow-md">
          {suggestions.map((suggestion) => (
            <li key={suggestion.key}>
              <button
                type="button"
                className="w-full rounded-md p-2.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-primary"
                onMouseDown={(e) => {
                  e.preventDefault()
                }}
                onClick={() => onSuggestionSelect?.(suggestion)}
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
