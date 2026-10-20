import Image from "next/image"
import { Layers, Radar, Globe2 } from "lucide-react"
import { FeaturePage } from "@/components/marketing/feature-page"
import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/layout/section-heading"

const methods = [
  { icon: Layers, title: "Layered intelligence", description: "Overlay live sensor data with traffic, land use, emissions hotspots, and weather to see drivers of pollution in context." },
  { icon: Radar, title: "Live signals", description: "Stream real-time AQI, PM, and gases with anomaly flags and data-quality indicators so you trust every pixel." },
  { icon: Globe2, title: "Spatial insights", description: "Spot clusters, gradients, and gaps instantly; jump between city view and street-level detail without losing context." },
]

const items = [
  "Interactive map with real-time AQI and pollutant layers",
  "Contextual overlays for traffic, land use, and emission sources",
  "Quality flags and sensor status for operational awareness",
  "Exportable snapshots for reports and stakeholder updates",
]

const aiSignals = [
  { title: "Smart smoothing", detail: "Spatial smoothing tuned to sensor spacing reduces false gradients without hiding real hotspots." },
  { title: "Anomaly flags", detail: "Drift and spike detection mark questionable readings so you trust what you see." },
  { title: "Gap filling", detail: "Short outages are bridged with nearby sensors and weather-aware estimates." },
]

function AiSection() {
  return (
    <Section>
      <Container>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
            <SectionHeading align="left" title="AI behind the scenes" description="Each map view runs on a lightweight inference layer that cleans, interpolates, and highlights issues in real time so what you see stays both responsive and trustworthy." />
            <ul className="mt-6 space-y-3">
              {aiSignals.map((s) => (
                <li key={s.title} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <div><p className="text-sm font-medium">{s.title}</p><p className="mt-1 text-sm text-muted-foreground">{s.detail}</p></div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="relative aspect-[10/7] overflow-hidden rounded-md border border-border bg-muted/40">
              <Image src="/images/model/heatap.webp" alt="AI processing layers visualization" fill className="object-cover" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">QA, smoothing, and gap filling in motion</p>
          </div>
        </div>
      </Container>
    </Section>
  )
}

export default function InteractiveMappingPage() {
  return (
    <FeaturePage
      badge="Interactive Mapping"
      Icon={Layers}
      title="How AI powers our live air quality maps"
      description="We fuse sensor streams with geospatial data and smart smoothing to deliver responsive, trustworthy maps that highlight where air quality is changing and why."
      primaryAction={{ href: "/map", label: "View Live Map" }}
      info={{ title: "What you see on the map", description: "Real-time pollutant levels, AI-smoothed surfaces, and point-level detail—paired with context layers to explain patterns and hotspots.", inputs: "Sensor streams, weather, traffic intensity, land use, emission sources, and historical baselines.", outputs: "Live AQI layers, heatmaps, anomaly flags, and downloadable map snapshots for reporting." }}
      image={{ src: "/images/homemap.webp", alt: "Interactive air quality map", caption: "AI-assisted live mapping" }}
      methods={methods}
      deliverables={{ title: "What you get", description: "The map is both operational and analytic: it tracks sensor health, surfaces hotspots, and lets you export evidence for rapid communication.", items }}
      panel={{ title: "Built for action", description: "Subscribe to alerts, snapshot evidence, and guide field teams with precise coordinates—all from the map view.", items: [{ title: "Trustworthy", description: "QA flags, calibration status, and data freshness visible on every layer." }, { title: "Shareable", description: "Download views or share links tailored to stakeholders." }], action: { href: "/map", label: "Explore the map" } }}
      extraSection={<AiSection />}
    />
  )
}
