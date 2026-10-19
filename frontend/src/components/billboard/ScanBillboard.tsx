"use client"

import { useRef } from "react"
import { QRCodeSVG } from "qrcode.react"

export default function ScanBillboard({ url, downloadable = false }: { url: string; downloadable?: boolean }) {
  const code = useRef<HTMLDivElement>(null)
  function download() {
    const svg = code.current?.querySelector("svg")
    if (!svg) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = objectUrl; link.download = "airqo-billboard-qr.svg"; link.click()
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }
  return <div className="flex items-center gap-4">
    <div ref={code} className="shrink-0 rounded-lg bg-white p-1">
      <a href={url} aria-label="Open this air quality billboard on your device" className="block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <QRCodeSVG value={url} size={128} level="M" marginSize={4} fgColor="#000000" bgColor="#ffffff" title="Scan to view this air quality" />
      </a>
    </div>
    <div className="max-w-52"><p className="text-sm font-bold">Scan to view<br />this air quality</p><p className="mt-1 text-xs opacity-80">Readings, forecasts and advice on your phone.</p>{downloadable && <button type="button" onClick={download} className="mt-3 rounded-lg border border-current px-3 py-2 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-blue-500">Download QR code</button>}</div>
  </div>
}
