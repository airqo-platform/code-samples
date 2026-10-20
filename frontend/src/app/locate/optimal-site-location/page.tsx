import { Layers, Ruler, Gauge, Sparkles } from "lucide-react"
import { FeaturePage } from "@/components/marketing/feature-page"

const methods = [
  { icon: Layers, title: "Multi-layer data", description: "Blend population density, land use, pollution sources, terrain, and existing monitors for a full context of each candidate location." },
  { icon: Ruler, title: "Constraint-aware siting", description: "Respect minimum spacing, must-have points, and geographic boundaries so recommendations are actionable in the field." },
  { icon: Gauge, title: "Exposure coverage", description: "Prioritize areas with higher population or vulnerable groups while ensuring coverage of key emission hotspots." },
  { icon: Sparkles, title: "Iterative optimization", description: "Run simulations across thousands of candidates and keep the configuration that maximizes coverage with the fewest devices." },
]

const items = [
  "Downloadable CSV with recommended coordinates, tagged by priority",
  "Interactive map to review, adjust, and lock must-have locations",
  "Clear rationale for each suggested site: population, source proximity, and coverage gain",
  "Ability to rerun scenarios with new constraints in seconds",
]

export default function OptimalSiteLocationPage() {
  return (
    <FeaturePage
      badge="Optimal Site Location"
      Icon={Layers}
      title="How we pick the best places to deploy air quality sensors"
      description="Our site locator blends geospatial data, demographic insights, and constraint-aware optimization to surface monitoring spots that maximize coverage and impact. Every recommendation comes with the evidence behind it."
      primaryAction={{ href: "/locate", label: "Launch Site Locator" }}
      info={{
        title: "What makes a site optimal?",
        description: "High coverage, strong signal on pollution sources, reliable access, and adherence to deployment rules. We balance these factors automatically so you deploy fewer sensors with better insight.",
        inputs: "Boundaries or drawn polygons, number of sensors, minimum spacing, must-have points, and optional CSV uploads of important sites.",
        outputs: "Ranked coordinates with scores for population coverage, source proximity, and marginal gain.",
      }}
      image={{ src: "/images/model/locate.webp", alt: "Optimal site locator visualization", caption: "AI-assisted site placement" }}
      methods={methods}
      deliverables={{ title: "What you get", description: "The tool translates complex geospatial analysis into a clear deployment plan. Each run is reproducible and can be tuned with new inputs at any time.", items }}
      panel={{
        title: "Field-ready and transparent",
        description: "We pair AI recommendations with the context teams need to validate sites on the ground: access hints, nearby infrastructure, and why each point was chosen.",
        items: [
          { title: "Validation-friendly", description: "Export results for offline review and sync updates when back online." },
          { title: "Continuous improvement", description: "Rerun scenarios as new monitors come online or priorities shift." },
        ],
        action: { href: "/locate", label: "Start a run" },
      }}
    />
  )
}
