"use client"

import { useState, useEffect, useRef } from "react"
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Layers,
  Link2,
  RefreshCw,
  Palette,
} from "lucide-react"
import Image from "next/image"
import { MAP_STYLE_OPTIONS } from "@/lib/map-config"
import { MapControlButton, MapZoomControls } from "./map-control-button"
import { cn } from "@/lib/utils"

const PM25_UNIT = "µg/m³"

const providerLabel = (p: string) =>
  p === "AIRQO" ? "AirQo" : p === "AIRGRADIENT" ? "AirGradient" : p.charAt(0) + p.slice(1).toLowerCase()

interface MapOverlayControlsProps {
  currentStyle: string
  onStyleChange: (style: string) => void
  pollutant: "pm2_5" | "pm10"
  onPollutantChange: (p: "pm2_5" | "pm10") => void
  providers: string[]
  selectedProvider: string
  onProviderChange: (p: string) => void
  heatmapEnabled: boolean
  showHeatmaps: boolean
  onShowHeatmapsChange: (v: boolean) => void
  showEmojis: boolean
  onShowEmojisChange: (v: boolean) => void
  showFires: boolean
  onShowFiresChange: (v: boolean) => void
  onCopyLink: () => void
  onRefresh: () => void
  onCapture: () => void
  isRefreshing: boolean
  isCapturing: boolean
  onGeolocate: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}

const AQI_LEGEND = [
  { image: "/images/GoodAir.png", label: "Good", range: `0.0 – 9.0 ${PM25_UNIT}` },
  { image: "/images/Moderate.png", label: "Moderate", range: `9.1 – 35.4 ${PM25_UNIT}` },
  { image: "/images/UnhealthySG.png", label: "Unhealthy for Sensitive Groups", range: `35.5 – 55.4 ${PM25_UNIT}` },
  { image: "/images/Unhealthy.png", label: "Unhealthy", range: `55.5 – 125.4 ${PM25_UNIT}` },
  { image: "/images/VeryUnhealthy.png", label: "Very Unhealthy", range: `125.5 – 225.4 ${PM25_UNIT}` },
  { image: "/images/Hazardous.png", label: "Hazardous", range: `225.5+ ${PM25_UNIT}` },
]

export function MapOverlayControls(props: MapOverlayControlsProps) {
  const [layersOpen, setLayersOpen] = useState(false)
  const [legendOpen, setLegendOpen] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : false
  )
  const [selectedStyle, setSelectedStyle] = useState(props.currentStyle)
  const layersRef = useRef<HTMLDivElement>(null)
  const legendRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedStyle(props.currentStyle)
  }, [props.currentStyle])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const onChange = (e: MediaQueryListEvent) => {
      if (!e.matches) setLegendOpen(false)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layersRef.current && !layersRef.current.contains(event.target as Node)) {
        setLayersOpen(false)
      }
      if (legendRef.current && !legendRef.current.contains(event.target as Node)) {
        setLegendOpen(false)
      }
    }
    if (layersOpen || legendOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [layersOpen, legendOpen])

  const handleApplyStyle = () => {
    props.onStyleChange(selectedStyle)
    setLayersOpen(false)
  }

  const handleCancelStyle = () => {
    setSelectedStyle(props.currentStyle)
    setLayersOpen(false)
  }

  return (
    <>
      {/* Top-left: pollutant + provider selects */}
      <div className="absolute left-3 top-3 z-[1100] flex flex-row gap-2">
        <div className="relative">
          <select
            value={props.pollutant}
            onChange={(e) => props.onPollutantChange(e.target.value as "pm2_5" | "pm10")}
            aria-label="Select pollutant"
            className="h-9 appearance-none rounded-full border border-border bg-card pl-3 pr-8 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
          >
            <option value="pm2_5">PM2.5</option>
            <option value="pm10">PM10</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>

        {props.providers.length > 1 ? (
          <div className="relative hidden min-[380px]:block">
            <select
              value={props.selectedProvider}
              onChange={(e) => props.onProviderChange(e.target.value)}
              aria-label="Select data provider"
              className="h-9 appearance-none rounded-full border border-border bg-card pl-3 pr-8 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
            >
              <option value="all">All Providers</option>
              {props.providers.map((p) => (
                <option key={p} value={p}>
                  {providerLabel(p)}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>

      {/* Top-right: layer control + actions */}
      <div className="absolute right-3 top-3 z-[1100] flex flex-col gap-2 sm:flex-col">
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-col sm:gap-2">
          <div ref={layersRef} className="relative">
            <MapControlButton
              onClick={() => setLayersOpen((v) => !v)}
              ariaLabel="Map layers and style"
              title="Layers"
              className="relative"
            >
              <Layers className="h-5 w-5" />
            </MapControlButton>

            {layersOpen && (
              <div
                role="dialog"
                aria-label="Map layers and style"
                className="absolute right-0 top-14 z-[1100] w-72 rounded-lg border border-border bg-card p-4 shadow-lg"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Map Style</h3>
                  </div>
                  <button
                    type="button"
                    aria-label="Close layers panel"
                    className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => setLayersOpen(false)}
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </div>

                <fieldset className="mb-3">
                  <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Layers
                  </legend>
                  {props.heatmapEnabled ? (
                    <label className="flex cursor-pointer items-center justify-between py-1 text-sm text-foreground">
                      <span>Heatmap</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border accent-primary"
                        checked={props.showHeatmaps}
                        onChange={(e) => props.onShowHeatmapsChange(e.target.checked)}
                      />
                    </label>
                  ) : null}
                  <label className="flex cursor-pointer items-center justify-between py-1 text-sm text-foreground">
                    <span>Station markers</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border accent-primary"
                      checked={props.showEmojis}
                      onChange={(e) => props.onShowEmojisChange(e.target.checked)}
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between py-1 text-sm text-foreground">
                    <span>Active fires</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border accent-primary"
                      checked={props.showFires}
                      onChange={(e) => props.onShowFiresChange(e.target.checked)}
                    />
                  </label>
                </fieldset>

                <fieldset>
                  <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Style
                  </legend>
                  <div className="grid grid-cols-2 gap-2 py-1">
                    {MAP_STYLE_OPTIONS.map((style) => (
                      <label
                        key={style.id}
                        className="cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="map-style"
                          value={style.id}
                          checked={selectedStyle === style.id}
                          onChange={() => setSelectedStyle(style.id)}
                          className="peer sr-only"
                        />
                        <div className="overflow-hidden rounded-md border-2 border-transparent peer-checked:border-primary">
                          <div className="relative h-16 w-full bg-muted overflow-hidden">
                            <Image
                              src={style.previewUrl || "/placeholder.svg"}
                              alt={style.label}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-1.5">
                            <div className="text-xs font-semibold text-foreground">{style.label}</div>
                            <div className="truncate text-[10px] text-muted-foreground">{style.description}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                  <button
                    type="button"
                    onClick={handleCancelStyle}
                    className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyStyle}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Apply Style
                  </button>
                </div>
              </div>
            )}
          </div>

          <MapControlButton
            onClick={props.onCopyLink}
            ariaLabel="Copy link"
            title="Copy link"
            className="hidden sm:flex"
          >
            <Link2 className="h-5 w-5" />
          </MapControlButton>
          <MapControlButton onClick={props.onRefresh} ariaLabel="Refresh data" title="Refresh" disabled={props.isRefreshing}>
            <RefreshCw className={cn("h-5 w-5", props.isRefreshing ? "animate-spin" : "")} />
          </MapControlButton>
          <MapControlButton onClick={props.onCapture} ariaLabel="Capture map view" title="Capture" disabled={props.isCapturing}>
            <Camera className={cn("h-5 w-5", props.isCapturing ? "animate-pulse" : "")} />
          </MapControlButton>
        </div>
      </div>

      {/* Bottom-right: geolocate + zoom */}
      <MapZoomControls
        onGeolocate={props.onGeolocate}
        onZoomIn={props.onZoomIn}
        onZoomOut={props.onZoomOut}
      />

      {/* Bottom-left: collapsible legend */}
      <div ref={legendRef} className="absolute bottom-3 left-3 z-[1100] hidden md:block">
        {legendOpen ? (
          <div className="w-60 rounded-lg border border-border bg-card p-2 shadow-lg">
            <button
              type="button"
              onClick={() => setLegendOpen(false)}
              aria-expanded={legendOpen}
              aria-controls="aqi-legend-panel"
              aria-label="Collapse legend"
              className="mb-1 flex w-full items-center justify-between rounded-md px-1 py-1 text-sm font-semibold text-foreground hover:bg-accent"
            >
              <span>Air quality key</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            <div id="aqi-legend-panel" className="space-y-1.5">
              {AQI_LEGEND.map((row) => (
                <div key={row.label} className="flex items-center gap-2 px-1">
                  <div className="relative h-7 w-7 shrink-0">
                    <Image src={row.image} alt={row.label} fill className="object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-foreground">{row.label}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{row.range}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLegendOpen(true)}
            aria-expanded={legendOpen}
            aria-controls="aqi-legend-panel"
            aria-label="Expand legend"
            title="Air quality key"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
        )}
      </div>
    </>
  )
}
