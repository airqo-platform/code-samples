"use client"

import { useEffect, useState } from "react"

export default function EmbedInstructions() {
  const [gridId, setGridId] = useState("")
  const [copyStatus, setCopyStatus] = useState("")
  const [origin, setOrigin] = useState("")
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const valid = /^[A-Za-z0-9_-]{1,128}$/.test(gridId.trim())
  const id = valid ? gridId.trim() : "YOUR_GRID_ID"
  const snippet = `<iframe
  src="${origin}/website-map-integration?grid_id=${id}"
  title="Air Quality Map"
  style="width:100%;height:800px;border:0;display:block;"
  loading="lazy"
></iframe>`

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopyStatus("Embed code copied.")
    } catch {
      setCopyStatus("Select and copy the code below.")
    }
  }

  return <section id="embed-map" className="bg-white py-16 dark:bg-slate-950 md:py-24">
    <div className="container mx-auto max-w-5xl px-4">
      <h2 className="text-3xl font-bold md:text-4xl">Add an air quality map to your website</h2>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
        Enter your AirQo grid ID, copy the iframe code, and paste it into your website’s HTML or custom HTML block.
        Your visitors can explore monitoring sites and their PM2.5 readings. No API key or plugin is needed on your website.
      </p>
      <div className="mt-6">
        <label htmlFor="embed-grid-id" className="block font-medium">AirQo grid ID</label>
        <input id="embed-grid-id" value={gridId} placeholder="Enter your grid ID" maxLength={128}
          aria-describedby="embed-grid-help"
          onChange={event => { setGridId(event.target.value); setCopyStatus("") }}
          className="mt-2 w-full max-w-lg rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
        <p id="embed-grid-help" className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Use the grid ID for the area you want to display. Contact AirQo if you need help finding it.
          {gridId.trim() && !valid && " Grid IDs may contain only letters, numbers, underscores, and hyphens."}
        </p>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-xl bg-slate-900 p-5 text-sm text-slate-100"><code>{snippet}</code></pre>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="button" onClick={copy} disabled={!origin} className="rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-600 disabled:opacity-50">
          Copy embed code
        </button>
        {valid && <a href={`/website-map-integration/?grid_id=${encodeURIComponent(gridId.trim())}`} target="_blank" rel="noopener noreferrer"
          className="font-medium text-blue-700 underline dark:text-blue-300">Preview your map</a>}
        <span role="status" className="text-sm">{copyStatus}</span>
      </div>
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
        Replace YOUR_GRID_ID if you copy the example without entering an ID. Adjust the height and title to suit your website.
        {" "}The code uses this site's address, including localhost or a Vercel preview. Copy it from the production site for your published website.
      </p>
    </div>
  </section>
}
