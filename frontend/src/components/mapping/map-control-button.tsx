import type React from "react"
import { LocateFixed, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MapControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel: string
  title?: string
  children: React.ReactNode
}

export function MapControlButton({
  ariaLabel,
  title,
  children,
  className,
  ...rest
}: MapControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={cn(
        "h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-border bg-card text-foreground shadow-md",
        "flex items-center justify-center transition-colors duration-150",
        "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

interface MapZoomControlsProps {
  onGeolocate: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  className?: string
}

export function MapZoomControls({ onGeolocate, onZoomIn, onZoomOut, className }: MapZoomControlsProps) {
  return (
    <div className={cn("absolute bottom-3 right-3 z-[1100] flex flex-col gap-2", className)}>
      <MapControlButton onClick={onGeolocate} ariaLabel="Find my location" title="Find my location">
        <LocateFixed className="h-5 w-5" aria-hidden="true" />
      </MapControlButton>
      <div className="flex flex-col overflow-hidden rounded-full border border-border bg-card shadow-md">
        <button
          type="button"
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="flex h-11 w-11 items-center justify-center text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="h-px w-full bg-border" aria-hidden="true" />
        <button
          type="button"
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="flex h-11 w-11 items-center justify-center text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
        >
          <Minus className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
