import { Layers, BrainCircuit, LineChart } from "lucide-react"
import { FeaturePage } from "@/components/marketing/feature-page"

const methods = [
  { icon: Layers, title: "Data fusion", description: "Combine sensor readings with weather, mobility, satellite observations, and emissions inventories for richer context." },
  { icon: BrainCircuit, title: "Predictive modeling", description: "Use machine learning to forecast pollution levels, fill gaps, and detect anomalies in near real-time." },
  { icon: LineChart, title: "Insight delivery", description: "Serve dashboards, alerts, and exportable reports tuned to researchers, regulators, and communities." },
]

const items = [
  "City and neighborhood air quality dashboards with trends and exceedances",
  "Forecasts to support planning around events, traffic, and weather shifts",
  "Automated QA/QC flags and anomaly detection for sensor health",
  "Report-ready downloads: CSV, charts, and embeddable widgets",
]

export default function DataAnalyticsPage() {
  return (
    <FeaturePage
      badge="Data Analytics"
      Icon={LineChart}
      title="How we turn raw air quality data into actionable insight"
      description="Our analytics layer blends AI models with domain expertise to clean, contextualize, and visualize air quality data for decision-makers. Every chart and alert is backed by transparent methods."
      primaryAction={{ href: "https://analytics.airqo.net/", label: "Open Analytics", external: true }}
      info={{
        title: "What “analytics” means here",
        description: "Clean data pipelines, calibrated sensors, explainable models, and visual stories tailored to local policy and community needs.",
        inputs: "Continuous sensor feeds, weather and satellite layers, land use, traffic intensity, and historical baselines.",
        outputs: "Forecasts, exceedance alerts, health-relevant indices, and exportable visuals for reports.",
      }}
      image={{ src: "/images/model/analyticsHome.webp", alt: "Air quality analytics dashboard", caption: "AI-driven analytics and reporting" }}
      methods={methods}
      deliverables={{ title: "What you get", description: "Analytics outputs are ready for action—whether you are drafting policy, planning interventions, or informing the public.", items }}
      panel={{
        title: "Operational and transparent",
        description: "Clear provenance, QA checks, and audit trails accompany every chart and forecast so teams can trust and act on the results.",
        items: [
          { title: "Explainable", description: "Show model drivers, data freshness, and uncertainty ranges." },
          { title: "Action-ready", description: "Subscribe to alerts, export charts, and share links with stakeholders." },
        ],
        action: { href: "https://analytics.airqo.net/", label: "Explore analytics", external: true },
      }}
    />
  )
}
