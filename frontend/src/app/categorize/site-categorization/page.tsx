import { Layers, Activity, ShieldCheck, Sparkles } from "lucide-react"
import { FeaturePage } from "@/components/marketing/feature-page"

const methods = [
  { icon: Layers, title: "Data-rich context", description: "Blend land use, road networks, night lights, vegetation, and industrial footprints to understand each site's environment." },
  { icon: Activity, title: "Signal vs. background", description: "Differentiate near-source hotspots from representative background areas so monitoring is balanced and meaningful." },
  { icon: ShieldCheck, title: "Robust features", description: "Use features resilient to noisy data: proximity bands, traffic intensity, urban density, elevation, and upwind/downwind cues." },
  { icon: Sparkles, title: "Model transparency", description: "Expose the evidence behind each classification so teams can trust the recommendation and override when needed." },
]

const items = [
  "Category label for every coordinate: Urban, Urban Background, or Background",
  "Supporting attributes: nearest road class, land cover, and point-of-interest density",
  "Downloadable CSV of results for bulk uploads",
  "Interactive map to verify, edit, and re-run scenarios quickly",
]

export default function SiteCategorizationPage() {
  return (
    <FeaturePage
      badge="Site Categorization"
      Icon={Layers}
      title="How we classify monitoring sites for clean, comparable data"
      description="We combine geospatial layers and machine learning to assign each coordinate to a category that reflects its local environment. That keeps your network balanced between hotspots and representative background sites."
      primaryAction={{ href: "/categorize", label: "Launch Categorize" }}
      info={{
        title: "Why categorization matters",
        description: "Consistent categories let you compare pollution levels across contexts, evaluate interventions, and ensure models and policies are anchored in representative data.",
        inputs: "Single clicks on the map, CSV uploads of coordinates, or pasted lists. Optional: area of interest for focused analysis.",
        outputs: "Category, nearby context indicators, and rationale for each point—ready for download or immediate use.",
      }}
      image={{ src: "/images/model/categorisemap.webp", alt: "Categorization map visualization", caption: "AI-assisted site categorization" }}
      methods={methods}
      deliverables={{ title: "What you get", description: "Each run produces a transparent, defensible classification for every site. Results can be exported or iterated on as your network evolves.", items }}
      panel={{
        title: "Built for planning and QA",
        description: "Use the map to verify categories visually, override edge cases, and keep a clean audit trail for every decision.",
        items: [
          { title: "Explainability", description: "See the features and context that drove each classification." },
          { title: "Fast iteration", description: "Rerun with new coordinate sets or AOIs in seconds." },
        ],
        action: { href: "/categorize", label: "Start a run" },
      }}
    />
  )
}
