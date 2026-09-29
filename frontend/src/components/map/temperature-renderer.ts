import type L from "leaflet"
import { sampleTemperature, temperatureColor, type TemperatureField } from "@/lib/temperature-field"

export function renderTemperature(map: L.Map, field: TemperatureField, hour: number, scale: [number, number], opacity: number) {
  const canvas = document.createElement("canvas")
  canvas.className = "temperature-field-overlay"
  canvas.setAttribute("aria-hidden", "true")
  Object.assign(canvas.style, { position: "absolute", pointerEvents: "none", opacity: String(opacity) })
  const pane = map.getPane("temperaturePane") ?? map.createPane("temperaturePane")
  pane.style.zIndex = "440"
  pane.style.pointerEvents = "none"
  pane.appendChild(canvas)
  const context = canvas.getContext("2d")
  if (!context) { canvas.remove(); return () => {} }
  const draw = () => {
    const size = map.getSize()
    if (!size.x || !size.y) return
    const origin = map.containerPointToLayerPoint([0, 0])
    Object.assign(canvas.style, { left: `${origin.x}px`, top: `${origin.y}px`, width: `${size.x}px`, height: `${size.y}px`, visibility: "visible" })
    canvas.width = Math.ceil(size.x / 4)
    canvas.height = Math.ceil(size.y / 4)
    const pixels = context.createImageData(canvas.width, canvas.height)
    for (let row = 0; row < canvas.height; row++) {
      for (let col = 0; col < canvas.width; col++) {
        const location = map.containerPointToLatLng([(col + 0.5) / canvas.width * size.x, (row + 0.5) / canvas.height * size.y])
        const temperature = sampleTemperature(field, hour, location.lat, location.lng)
        if (temperature === null) continue
        pixels.data.set([...temperatureColor(temperature, scale), 255], (row * canvas.width + col) * 4)
      }
    }
    context.putImageData(pixels, 0, 0)
  }
  const hide = () => { canvas.style.visibility = "hidden" }
  map.on("movestart zoomstart", hide)
  map.on("moveend resize", draw)
  draw()
  return () => {
    map.off("movestart zoomstart", hide)
    map.off("moveend resize", draw)
    canvas.remove()
  }
}
