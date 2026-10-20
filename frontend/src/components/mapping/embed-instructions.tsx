"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, Braces, Check, Code2, Copy, Globe, Layers, Server } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"

const guideUrl = "https://platform.airqo.net/docs/api/for-cities/website-map-integration/"
const gridGuideUrl = "https://platform.airqo.net/docs/api/for-cities/intro/#finding-your-grid-id"
const options = [
  { id: "iframe", title: "Quick · No coding", icon: Globe },
  { id: "developer", title: "Developer", icon: Code2 },
]

export default function EmbedInstructions() {
  const [gridId, setGridId] = useState("")
  const [copyStatus, setCopyStatus] = useState("")
  const [origin, setOrigin] = useState("")
  const [mode, setMode] = useState("iframe")
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const valid = /^[A-Za-z0-9_-]{1,128}$/.test(gridId.trim())
  const id = valid ? gridId.trim() : "YOUR_GRID_ID"
  const snippet = `<iframe
  src="${origin}/website-map-integration?grid_id=${id}"
  title="Air Quality Map"
  style="width:100%;height:800px;border:0;display:block;"
  loading="lazy"
></iframe>`

  const gridIdError = gridId.trim() && !valid ? "Grid IDs may contain only letters, numbers, underscores, and hyphens." : undefined
  const gridIdTouched = gridId.trim().length > 0
  const describedBy = gridIdTouched
    ? `${gridIdError ? "embed-grid-id-error " : ""}embed-grid-id-description`.trim()
    : "embed-grid-id-description"

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopyStatus("Embed code copied.")
    } catch {
      setCopyStatus("Select and copy the code below.")
    }
  }

  return <section id="embed-map" className="bg-card py-16 [font-family:inherit] md:py-24">
    <div className="container mx-auto max-w-5xl px-4">
      <div className="mb-4"><Badge variant="accent"><Layers size={16} /> A quick start.</Badge></div>
      <h2 className="text-3xl font-bold md:text-4xl">Add an air quality map to your website</h2>
      <p className="mt-4 text-lg text-muted-foreground">
        Start with a simple embed, or take control of the code. Choose the integration that fits your website.
      </p>
      <Tabs value={mode} onValueChange={setMode} className="mt-8">
        <TabsList aria-label="Choose your website integration" className="relative grid h-auto w-full max-w-lg grid-cols-2 rounded-2xl border border-border bg-muted p-1">
          <span aria-hidden="true" className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-card shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none ${mode === "developer" ? "translate-x-full" : "translate-x-0"}`} />
          {options.map(option => <TabsTrigger key={option.id} value={option.id}
            className="relative z-10 min-w-0 gap-2 whitespace-normal rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors focus-visible:ring-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none sm:text-base">
            <option.icon size={18} className="shrink-0" />{option.title}
          </TabsTrigger>)}
        </TabsList>
        <TabsContent value="iframe" className="embed-option-panel mt-5 rounded-2xl border border-border p-5 sm:p-8">
          <div className="flex items-start gap-3"><span className="rounded-xl bg-accent p-3 text-primary"><Globe size={24} /></span><div>
            <h3 className="text-xl font-semibold">Copy. Paste. You're live.</h3>
            <p className="mt-2 text-muted-foreground">Add your grid ID and paste the code into your website's HTML or custom HTML block. No API key or backend setup is needed on your website.</p>
          </div></div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {["Live site readings", "7-day forecasts", "Heatmap overlay"].map(feature => <span key={feature} className="inline-flex items-center gap-2"><Check size={15} className="text-primary" />{feature}</span>)}
          </div>
      <div className="mt-6 w-full rounded-2xl border border-border bg-accent/40 p-4 sm:p-5">
        <Field
          label="AirQo grid ID"
          htmlFor="embed-grid-id"
          description={<span>Your grid ID connects the map to the monitoring sites in your city or region. <a href={gridGuideUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">Find your grid ID <ArrowUpRight size={15} className="inline" /></a></span>}
          error={gridIdError}
          required
        >
          <Input
            id="embed-grid-id"
            type="text"
            value={gridId}
            placeholder="Enter your grid ID"
            maxLength={128}
            aria-invalid={gridIdTouched && !valid ? true : undefined}
            aria-describedby={describedBy}
            onChange={(event) => { setGridId(event.target.value); setCopyStatus("") }}
            className="h-12 rounded-xl border-border bg-muted px-4 focus-visible:bg-card"
          />
        </Field>
      </div>
      <pre className="mt-6 overflow-x-auto rounded-xl bg-slate-900 p-5 text-sm leading-relaxed text-slate-100 [font-family:inherit]"><code className="[font-family:inherit]">{snippet}</code></pre>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button type="button" onClick={copy} disabled={!origin} size="lg">
          <Copy size={16} /> Copy embed code
        </Button>
        {valid && (
          <Button asChild variant="outline" size="lg">
            <a href={`/website-map-integration/?grid_id=${encodeURIComponent(gridId.trim())}`} target="_blank" rel="noopener noreferrer">
              <Globe size={16} /> Preview your map <ArrowUpRight size={16} />
            </a>
          </Button>
        )}
        {copyStatus && <span role="status" className="text-sm">{copyStatus}</span>}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Replace YOUR_GRID_ID if you copy the example without entering an ID. Adjust the height and title to suit your website.
        {" "}The code uses this site's address, including localhost. Copy it from the production site for your published website.
      </p>
        </TabsContent>
        <TabsContent value="developer" className="embed-option-panel mt-5">
          <div className="mb-5"><h3 className="text-xl font-semibold">Choose your starting point</h3><p className="mt-2 text-sm text-muted-foreground">Use the HTML sample or the PHP version to customize and host the map yourself.</p></div>
          <Tabs defaultValue="html">
            <TabsList aria-label="Choose a developer implementation" className="mb-4 h-auto gap-1 rounded-xl bg-muted p-1">
              <TabsTrigger value="html" className="gap-2 rounded-lg px-4 py-2 focus-visible:ring-blue-600"><Code2 size={16} />HTML + JavaScript</TabsTrigger>
              <TabsTrigger value="php" className="gap-2 rounded-lg px-4 py-2 focus-visible:ring-blue-600"><Server size={16} />PHP</TabsTrigger>
            </TabsList>
            <TabsContent value="html" className="embed-option-panel mt-0"><DeveloperPanel variant="html" /></TabsContent>
            <TabsContent value="php" className="embed-option-panel mt-0"><DeveloperPanel variant="php" /></TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>Need help choosing? The integration guide walks through both developer options.</span>
        <a href={guideUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline">Read the full guide <ArrowUpRight size={15} /></a>
      </div>
    </div>
  </section>
}

function DeveloperPanel({ variant }: { variant: "html" | "php" }) {
  const isPhp = variant === "php"
  const folder = isPhp ? "php" : "javascript"
  const file = `leaflet-with-forecast.${isPhp ? "php" : "html"}`
  const sourceBase = `https://github.com/airqo-platform/code-samples/blob/staging/${folder}`
  const steps = isPhp ? [
    "Use the PHP map page with the files from the php folder.",
    "Configure your grid ID and API token in the private Node service.",
    "Serve the page through PHP and route its API requests to the Node service.",
  ] : [
    "Use the HTML map page with the files from the javascript folder.",
    "Configure your grid ID and API token in the Node service.",
    "Serve the page and proxy on your domain, then customize the map code.",
  ]

  return <div className="overflow-hidden rounded-2xl border border-border">
    <div className="grid lg:grid-cols-[1.3fr_1fr]">
      <div className="p-5 sm:p-8">
        <div className="flex items-start gap-3"><span className="rounded-xl bg-accent p-3 text-primary">{isPhp ? <Server size={24} /> : <Code2 size={24} />}</span><div>
          <h3 className="text-xl font-semibold">{isPhp ? "Bring the map into your PHP site" : "Make the map part of your own experience"}</h3>
          <p className="mt-2 text-muted-foreground">{isPhp ? "A PHP-served map page for your CMS or custom website, with the source available to adapt." : "An open-source HTML and JavaScript map you can style, extend, and host on your own website."}</p>
        </div></div>
        <ol className="mt-6 space-y-4">
          {steps.map((step, index) => <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-primary">{index + 1}</span><span>{step}</span></li>)}
        </ol>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={`${sourceBase}/${file}`} target="_blank" rel="noopener noreferrer">
              View {isPhp ? "PHP" : "HTML"} source <ArrowUpRight size={16} />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={guideUrl} target="_blank" rel="noopener noreferrer">
              Setup guide <ArrowUpRight size={16} />
            </a>
          </Button>
        </div>
      </div>
      <div className="border-t border-border bg-muted p-5 sm:p-8 lg:border-l lg:border-t-0">
        <h4 className="flex items-center gap-2 font-semibold"><Braces size={18} className="text-primary" /> Your code. Your control.</h4>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          {["Customize layout, colors, and controls", "Adapt search, forecasts, and map layers", "Host the map on your own domain"].map(feature => <li key={feature} className="flex items-center gap-2"><Check size={16} className="shrink-0 text-primary" />{feature}</li>)}
        </ul>
        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-sm">
          <p className="font-semibold">What you'll need</p>
          <p className="mt-2 leading-relaxed text-muted-foreground">{isPhp ? "PHP hosting, a Node.js backend, an AirQo grid ID, and a server-side API token." : "A Node.js backend, an AirQo grid ID, and a server-side API token."} Forecasts require Premium API access.</p>
        </div>
        <a href={`${sourceBase}/leaflet-forecast-server.js`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary underline">View the backend sample <ArrowUpRight size={14} /></a>
      </div>
    </div>
  </div>
}
