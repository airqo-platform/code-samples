"use client"

import React, { useEffect, useRef, useState } from "react"

const FADE_OUT_MS = 300

interface LoadingOverlayProps {
  /**
   * Whether the overlay is visible
   */
  isVisible?: boolean
  /**
   * Additional CSS classes for the overlay
   */
  className?: string
  /**
   * Delay (ms) before showing to reduce flicker on fast transitions
   */
  delayMs?: number
  /**
   * Optional heading displayed below the loader
   */
  title?: string
  /**
   * Optional supporting text displayed below the title
   */
  description?: string
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible = true,
  className = "",
  delayMs = 120,
  title,
  description,
}) => {
  const [shouldRender, setShouldRender] = useState(isVisible && delayMs === 0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const hideTimerRef = useRef<number | null>(null)
  const hasCopy = Boolean(title || description)

  useEffect(() => {
    if (isVisible) {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
      // The state resets are deferred a microtask so the effect body itself
      // never calls setState synchronously (react-hooks/set-state-in-effect);
      // microtasks run before the next paint, so the timing is unchanged.
      queueMicrotask(() => {
        setIsFadingOut(false)
        if (delayMs === 0) setShouldRender(true)
      })
      if (delayMs === 0) return
      const timeoutId = window.setTimeout(() => {
        setShouldRender(true)
      }, delayMs)
      return () => window.clearTimeout(timeoutId)
    }

    if (!shouldRender) return

    // Deferred like the show path above: the microtask runs before the next
    // paint, so the 300ms fade-out still starts immediately while the effect
    // body stays free of synchronous setState calls.
    queueMicrotask(() => setIsFadingOut(true))
    hideTimerRef.current = window.setTimeout(() => {
      setShouldRender(false)
      setIsFadingOut(false)
    }, FADE_OUT_MS)

    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
      }
    }
  }, [delayMs, isVisible, shouldRender])

  if (!shouldRender && !isFadingOut) return null

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isFadingOut ? "opacity-0" : "opacity-100"} ${className}`}
      role="status"
      aria-live="polite"
    >
      {hasCopy ? (
        <div
          className={`flex flex-col items-center gap-4 rounded-lg border border-border bg-card/90 px-8 py-6 text-center shadow-sm transition-opacity duration-300 ease-in-out ${isFadingOut ? "opacity-0" : "opacity-100"}`}
        >
          <div className="SecondaryMainloader text-primary" aria-label={title || "Loading"} />
          <div className="max-w-sm space-y-1">
            {title ? <p className="text-sm font-medium text-foreground">{title}</p> : null}
            {description ? (
              <p className="text-xs leading-5 text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="SecondaryMainloader text-primary" aria-label="Loading" />
      )}
    </div>
  )
}

LoadingOverlay.displayName = "LoadingOverlay"

export { LoadingOverlay }
export type { LoadingOverlayProps }
