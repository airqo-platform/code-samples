"use client"

import { useEffect, useRef, useState } from "react"

export default function ActionFrames({ src, poster, title, duration, paused, loop }: { src: string; poster: string; title: string; duration: number; paused: boolean; loop: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const clock = useRef({ elapsed: 0, last: 0 })
  const [sheet, setSheet] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    let cancelled = false
    setSheet(null)
    clock.current = { elapsed: 0, last: 0 }
    const image = new Image()
    image.onload = () => { if (!cancelled) setSheet(image) }
    image.src = src
    return () => { cancelled = true }
  }, [src])

  useEffect(() => {
    const context = canvas.current?.getContext("2d")
    if (!context || !sheet) return
    let request = 0
    clock.current.last = 0
    const paint = (now: number) => {
      const timer = clock.current
      if (timer.last && !paused) timer.elapsed += Math.min(now - timer.last, 64)
      timer.last = now
      // Continuous actions cycle forward; gestures return without a hard reset.
      const phase = (timer.elapsed % duration) / duration
      const position = loop ? phase * 8 : (phase < .5 ? phase * 2 : (1 - phase) * 2) * 7
      const frame = Math.round(position) % 8
      context.clearRect(0, 0, 192, 256)
      context.globalCompositeOperation = "source-over"
      context.globalAlpha = 1
      // Render one opaque pose at a time: overlapping silhouettes create haze.
      context.drawImage(sheet, frame * 192, 0, 192, 256, 0, 0, 192, 256)
      if (!paused) request = requestAnimationFrame(paint)
    }
    request = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(request)
  }, [sheet, duration, paused, loop])

  return <div role="img" aria-label={title} className="realistic-action-window relative mx-auto h-full w-[180px] shrink-0 overflow-hidden">
    {!sheet && <img src={poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain object-bottom" />}
    <canvas ref={canvas} width={192} height={256} aria-hidden="true" className="h-full w-full" style={{ visibility: sheet ? "visible" : "hidden" }} />
  </div>
}
