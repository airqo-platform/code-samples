import { Activity, Shield, Users } from "lucide-react"
import { FeaturePage } from "@/components/marketing/feature-page"

const methods = [
  { icon: Activity, title: "Exposure modeling", description: "Combine air quality fields with population distribution, time-activity patterns, and vulnerability indicators." },
  { icon: Shield, title: "Risk estimation", description: "Translate exposures into health impact metrics using peer-reviewed concentration-response functions." },
  { icon: Users, title: "Equity insights", description: "Highlight groups and neighborhoods bearing disproportionate burden to guide targeted interventions." },
]

const items = [
  "Health-weighted pollution burden by neighborhood and demographic group",
  "Attributable cases estimates (e.g., hospital visits) with uncertainty bands",
  "Scenario comparisons for interventions and seasonal changes",
  "Downloadable summaries and visualizations for policy briefs",
]

export default function HealthImpactPage() {
  return (
    <FeaturePage
      badge="Health Impact"
      Icon={Activity}
      title="How AI links air quality to health outcomes"
      description="We pair exposure models with epidemiological evidence to estimate health impacts, helping policymakers prioritize interventions that matter most for communities."
      primaryAction={{ href: "/comingsoon", label: "View Roadmap" }}
      info={{
        title: "Why health impact modeling",
        description: "Translating pollution into health metrics puts urgency and equity into focus—showing where cleaner air delivers the biggest human gains.",
        inputs: "High-resolution concentration fields, population and vulnerability data, baseline health rates, and weather modifiers.",
        outputs: "Health burden estimates, uncertainty ranges, and maps that highlight priority areas.",
      }}
      image={{ src: "/images/model/calibration-header.webp", alt: "Health impact visualization", caption: "Health burden modeling" }}
      methods={methods}
      deliverables={{ title: "What you get", description: "Clear, defensible health impact estimates that connect air quality to human outcomes, ready for policy briefs and funding proposals.", items }}
      panel={{
        title: "Transparent and equitable",
        description: "Every estimate carries context on data sources, assumptions, and uncertainty so communities and policymakers can trust the results.",
        items: [
          { title: "Explainable", description: "See which factors drive risk in each neighborhood." },
          { title: "Actionable", description: "Compare scenarios to plan interventions and funding." },
        ],
        action: { href: "/comingsoon", label: "Follow progress" },
      }}
    />
  )
}
