import { useEffect, useRef } from "react"
import { useMap } from "react-leaflet"
import type L from "leaflet"

interface MapInstanceBridgeProps {
  onReady: (map: L.Map) => void
}

export function MapInstanceBridge({ onReady }: MapInstanceBridgeProps) {
  const map = useMap()
  // Keep the latest callback in a ref so the effect below only re-runs when the
  // map instance changes, not on every render of the parent.
  const onReadyRef = useRef(onReady)

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  // The default popup pane is nested inside .leaflet-map-pane, which creates a
  // stacking context (z-index 400), so no z-index on it can rise above the React
  // controls (z-1100). Create a dedicated pane as a direct child of the map
  // container (sibling of .leaflet-map-pane) so it can sit above those overlays.
  useEffect(() => {
    const existingPane = map.getPane("highPopupPane")
    const pane = existingPane ?? map.createPane("highPopupPane", map.getContainer())
    pane.style.zIndex = "1300"
    pane.style.pointerEvents = "none"

    // The container-level pane sits outside .leaflet-map-pane, so Leaflet does
    // not transform it during pan/zoom — popups would drift from their anchors.
    // Mirror the map pane's transform on every movement event instead.
    const mapPane = map.getPane("mapPane")
    const syncPaneTransform = () => {
      if (!mapPane) return
      pane.style.transform = mapPane.style.transform || "translate3d(0px, 0px, 0px)"
      pane.style.transformOrigin = "0 0"
    }
    syncPaneTransform()
    map.on("move zoom viewreset zoomend moveend", syncPaneTransform)

    return () => {
      map.off("move zoom viewreset zoomend moveend", syncPaneTransform)
      if (!existingPane) pane.remove()
    }
  }, [map])

  useEffect(() => {
    onReadyRef.current(map)
  }, [map])
  return null
}
