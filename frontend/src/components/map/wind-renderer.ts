import type L from "leaflet"
import { sampleWind, windColor, type WindField } from "@/lib/wind-field"

const CELL = 6
interface Particle { x: number; y: number; age: number }

export function renderWind(map: L.Map, field: WindField, animate: boolean) {
  const root = document.createElement("div")
  root.className = "wind-field-overlay"
  root.setAttribute("aria-hidden", "true")
  Object.assign(root.style, { position: "absolute", pointerEvents: "none", overflow: "hidden" })
  const shading = document.createElement("canvas")
  const trails = document.createElement("canvas")
  for (const canvas of [shading, trails]) {
    Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%" })
    root.appendChild(canvas)
  }
  const pane = map.getPane("windPane") ?? map.createPane("windPane")
  pane.style.zIndex = "450"
  pane.style.pointerEvents = "none"
  pane.appendChild(root)
  const context = trails.getContext("2d")
  const colorContext = shading.getContext("2d")
  if (!context || !colorContext) { root.remove(); return () => {} }
  let width = 0
  let height = 0
  let columns = 0
  let velocity = new Float32Array()
  let particles: Particle[] = []
  let frame = 0
  let previous = 0
  let moving = false
  const seed = (): Particle => ({ x: Math.random() * width, y: Math.random() * height, age: Math.random() * 4 })
  const vectorAt = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return null
    const index = (Math.floor(y / CELL) * columns + Math.floor(x / CELL)) * 2
    const u = velocity[index]
    const v = velocity[index + 1]
    return Number.isFinite(u) && Number.isFinite(v) ? [u, v] : null
  }
  const paint = () => {
    const size = map.getSize()
    width = size.x
    height = size.y
    if (!width || !height) return
    const origin = map.containerPointToLayerPoint([0, 0])
    Object.assign(root.style, { left: `${origin.x}px`, top: `${origin.y}px`, width: `${width}px`, height: `${height}px` })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    trails.width = Math.round(width * dpr)
    trails.height = Math.round(height * dpr)
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    columns = Math.ceil(width / CELL) + 1
    const rows = Math.ceil(height / CELL) + 1
    shading.width = columns
    shading.height = rows
    velocity = new Float32Array(columns * rows * 2).fill(NaN)
    const pixels = colorContext.createImageData(columns, rows)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const latLng = map.containerPointToLatLng([col * CELL, row * CELL])
        const wind = sampleWind(field, latLng.lat, latLng.lng)
        if (!wind) continue
        const index = row * columns + col
        // Mercator is conformal: scale both components equally. Canvas Y points south.
        const scale = 6 / Math.max(0.25, Math.cos(latLng.lat * Math.PI / 180))
        velocity[index * 2] = wind.u * scale
        velocity[index * 2 + 1] = -wind.v * scale
        pixels.data.set([...windColor(Math.hypot(wind.u, wind.v)), 165], index * 4)
      }
    }
    colorContext.putImageData(pixels, 0, 0)
    particles = Array.from({ length: Math.min(3200, Math.max(500, Math.floor(width * height / 450))) }, seed)
    context.strokeStyle = "rgba(255,255,255,0.85)"
    context.lineWidth = 1.2
    context.lineCap = "round"
    if (!animate) {
      // Reduced-motion/paused mode still shows flow direction throughout the map.
      context.beginPath()
      for (let y = 20; y < height; y += 32) {
        for (let x = 20; x < width; x += 32) {
          const vector = vectorAt(x, y)
          if (!vector) continue
          const magnitude = Math.hypot(...vector)
          if (magnitude < 0.6) continue
          const dx = vector[0] / magnitude
          const dy = vector[1] / magnitude
          const endX = x + dx * 12
          const endY = y + dy * 12
          context.moveTo(x, y)
          context.lineTo(endX, endY)
          context.moveTo(endX - dx * 4 - dy * 3, endY - dy * 4 + dx * 3)
          context.lineTo(endX, endY)
          context.lineTo(endX - dx * 4 + dy * 3, endY - dy * 4 - dx * 3)
        }
      }
      context.stroke()
    }
  }
  const tick = (time: number) => {
    if (document.hidden || moving || !animate) { frame = 0; return }
    frame = requestAnimationFrame(tick)
    if (time - previous < 1000 / 30) return
    const dt = Math.min((time - previous) / 1000, 0.05)
    previous = time
    context.globalCompositeOperation = "destination-in"
    context.fillStyle = `rgba(0,0,0,${Math.pow(0.92, dt * 30)})`
    context.fillRect(0, 0, width, height)
    context.globalCompositeOperation = "source-over"
    context.beginPath()
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]
      const vector = vectorAt(particle.x, particle.y)
      if (!vector || particle.age > 4) { particles[i] = { ...seed(), age: 0 }; continue }
      const x = particle.x + vector[0] * dt
      const y = particle.y + vector[1] * dt
      if (Math.hypot(...vector) > 0.6) {
        context.moveTo(particle.x, particle.y)
        context.lineTo(x, y)
      }
      particle.x = x
      particle.y = y
      particle.age += dt
    }
    context.stroke()
  }
  const start = () => {
    if (!frame && animate && !moving && !document.hidden) { previous = performance.now(); frame = requestAnimationFrame(tick) }
  }
  const stop = () => { cancelAnimationFrame(frame); frame = 0 }
  const moveStart = () => { moving = true; root.style.visibility = "hidden"; stop() }
  const moveEnd = () => { moving = false; paint(); root.style.visibility = "visible"; start() }
  const visibilityChange = () => { if (document.hidden) stop(); else start() }
  map.on("movestart zoomstart", moveStart)
  map.on("moveend resize", moveEnd)
  document.addEventListener("visibilitychange", visibilityChange)
  paint()
  start()
  return () => {
    stop()
    map.off("movestart zoomstart", moveStart)
    map.off("moveend resize", moveEnd)
    document.removeEventListener("visibilitychange", visibilityChange)
    root.remove()
  }
}
