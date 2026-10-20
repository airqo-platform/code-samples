import type { LucideIcon } from "lucide-react"
import { BarChart, Bot, Map as MapIcon, Satellite, Thermometer, Wind, AlertTriangle, Database, MapPin } from "lucide-react"
import { PageShell } from "@/components/layout/page-shell"
import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/layout/section-heading"
import { FeatureCard } from "@/components/marketing/feature-card"

type ToolCard = { title: string; description: string; Icon: LucideIcon; href: string; imageSrc: string }

const tools: ToolCard[] = [
  { title: "AirQalibrate", description: "AirQalibrate is a Machine Learning based calibration tool that eliminates the need for reference-grade monitors or on-site monitor calibration.", Icon: Thermometer, href: "https://airqo.net/products/calibrate", imageSrc: "/images/model/airqalibration.webp" },
  { title: "Fault Detection", description: "Uses the Isolation Forest model to detect anomalies in sensor devices, identifying issues like electromagnetic interference or dust accumulation.", Icon: AlertTriangle, href: "https://airqo.net/products/calibrate", imageSrc: "/images/model/calibration-header.webp" },
  { title: "Air Quality Forecast", description: "Predicts future air quality levels to inform individual and policy decisions, minimizing exposure to pollution.", Icon: Wind, href: "https://analytics.airqo.net/map", imageSrc: "/images/model/forecast.webp" },
  { title: "Pollution Heatmap", description: "Visualizes air pollution levels across regions, helping identify high-risk areas for targeted interventions.", Icon: MapIcon, href: "https://ai.airqo.net/map", imageSrc: "/images/model/heatap.webp" },
  { title: "PM2.5 Prediction", description: "Leverages satellite data to predict PM2.5 concentrations, providing insights into fine particulate matter pollution.", Icon: Satellite, href: "https://ai.airqo.net/map", imageSrc: "/images/model/predictsatellite.webp" },
  { title: "Locate", description: "Pinpoints air quality monitoring stations, enabling communities to access localized pollution data.", Icon: MapPin, href: "https://ai.airqo.net/locate", imageSrc: "/images/model/locate.webp" },
  { title: "Stationary Pollution Source", description: "Identifies pollution sources using satellite imagery and TensorFlow models, aiding in targeted mitigation strategies.", Icon: Database, href: "https://ai.airqo.net/", imageSrc: "/images/model/calibration-header.webp" },
]

const future: ToolCard[] = [
  { title: "Chatbot", description: "An AI-powered chatbot to provide real-time air quality information and answer user queries interactively.", Icon: Bot, href: "https://airqo.net", imageSrc: "/images/model/chatbot.webp" },
  { title: "Filling Missing Data", description: "Advanced algorithms to impute missing air quality data, ensuring continuous and reliable monitoring.", Icon: Database, href: "https://airqo.net", imageSrc: "/images/model/fillingap.webp" },
  { title: "Land Use Model", description: "Analyzes land use patterns to understand their impact on air quality, supporting urban planning and policy.", Icon: BarChart, href: "https://airqo.net", imageSrc: "/images/model/landuse.webp" },
]

function ToolGrid({ items }: { items: ToolCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((card) => (
        <FeatureCard key={card.title} title={card.title} description={card.description} Icon={card.Icon} href={card.href} openInNewTab imageSrc={card.imageSrc} />
      ))}
    </div>
  )
}

export default function AIModels() {
  return (
    <PageShell>
      <Section compact>
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="AI Models"
            title="AI Models at AirQo"
            description="At AirQo, we leverage cutting-edge AI to revolutionize air quality monitoring across African cities. Explore our innovative models driving real-time insights, predictive analytics, and community empowerment."
          />
        </Container>
      </Section>
      <Section>
        <Container>
          <h2 className="text-2xl font-medium tracking-tight">Our AI-Powered Tools</h2>
          <div className="mt-6">
            <ToolGrid items={tools} />
          </div>
        </Container>
      </Section>
      <Section muted>
        <Container>
          <h2 className="text-2xl font-medium tracking-tight">Future Works</h2>
          <div className="mt-6">
            <ToolGrid items={future} />
          </div>
        </Container>
      </Section>
    </PageShell>
  )
}
