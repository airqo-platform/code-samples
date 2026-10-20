"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowRight, Code2, MapPin, Wind, BarChart3, BrainCircuit, Shield, Database, Cpu, LineChart } from "lucide-react"
import { PageShell } from "@/components/layout/page-shell"
import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/layout/section-heading"
import { FeatureCard } from "@/components/marketing/feature-card"
import { Button } from "@/components/ui/button"
import { ProcessCard } from "@/components/marketing/process-card"
import EmbedInstructions from "@/components/mapping/embed-instructions"

const featureCards = [
  { imageSrc: "/images/model/locate.webp", Icon: MapPin, title: "Optimal Site Location", description: "Use AI algorithms to determine the best locations for air quality monitors based on population density, pollution sources, and geographic factors.", href: "/locate/optimal-site-location" },
  { Icon: Wind, title: "Air Quality Categorization", description: "Automatically categorize monitoring sites based on surrounding land use, traffic patterns, and environmental factors.", href: "/categorize/site-categorization", imageSrc: "/images/model/categorisemap.webp" },
  { Icon: BarChart3, title: "Data Analytics", description: "Generate comprehensive reports with trends, forecasts, and actionable insights from air quality data.", href: "/analytics/data-analytics", imageSrc: "/images/model/analyticsHome.webp" },
  { Icon: BrainCircuit, title: "Machine Learning Models", description: "Continuously improving prediction models that account for seasonal variations, weather patterns, and human activities.", href: "/models", imageSrc: "/images/model/modelapi.webp" },
  { Icon: Shield, title: "Health Impact Assessment", description: "Evaluate potential health impacts of air pollution on different population groups and geographic areas.", href: "/comingsoon/health-impact", imageSrc: "/images/model/calibration-header.webp" },
  { Icon: MapPin, title: "Interactive Mapping", description: "Visualize air quality data across regions with interactive maps showing real-time pollution levels.", href: "/map/interactive-mapping", imageSrc: "/images/homemap.webp" },
]

const processCards = [
  { icon: <Database className="w-8 h-8 text-primary" />, number: "01", title: "Data Collection", description: "Our network of sensors continuously collects air quality data across multiple locations.", imageSrc: "/images/model/calibration-header.webp" },
  { icon: <Cpu className="w-8 h-8 text-primary" />, number: "02", title: "AI Processing", description: "Advanced algorithms clean, analyze, and interpret the data to generate insights.", imageSrc: "/images/model/modelapi.webp" },
  { icon: <LineChart className="w-8 h-8 text-primary" />, number: "03", title: "Actionable Insights", description: "Users access visualizations, reports, and recommendations through our various platform.", imageSrc: "/images/model/analyticsHome.webp" },
]

const Home: React.FC = () => {
  const router = useRouter()

  return (
    <PageShell>
      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center bg-muted/60 py-12 sm:py-16 md:py-20">
        <div className="absolute inset-0 bg-cover bg-center opacity-10"></div>
        <Container className="relative z-10">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6 text-foreground">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                AI-Powered Air Quality Monitoring
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                AirQo AI provides advanced tools for monitoring, analyzing, and optimizing air quality across African
                cities using artificial intelligence.
              </p>
              <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
                <Button asChild size="xl">
                  <Link href="/map">Explore Air Quality Map <ArrowRight size={18} /></Link>
                </Button>
                <Button asChild size="xl" variant="outline">
                  <a href="#embed-map"><Code2 size={18} /> Embed on your website</a>
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div
                className="relative h-[500px] w-full max-w-[900px] overflow-hidden rounded-xl shadow-2xl mx-auto cursor-pointer"
                onDoubleClick={() => router.push("/map")}
              >
                <Image src="/images/homemap.webp" alt="Air quality monitoring dashboard" fill className="object-cover" />
              </div>
            </div>
            <div className="md:hidden">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                <Image src="/images/homemap.webp" alt="Air quality monitoring dashboard" fill className="object-cover" />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Key Features Section */}
      <Section>
        <Container>
          <SectionHeading
            title="Powered by Artificial Intelligence"
            description="Our platform leverages cutting-edge AI to provide accurate, real-time air quality data and insights for researchers, policymakers, and citizens."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </Container>
      </Section>

      <EmbedInstructions />

      {/* Billboard Section */}
      <Section muted>
        <Container>
          <div className="grid max-w-6xl items-center gap-12 lg:grid-cols-[1.2fr_1fr] mx-auto">
            <div>
              <h2 className="max-w-4xl text-4xl font-bold leading-tight md:text-5xl">Bring air quality to the big screen</h2>
              <p className="my-6 max-w-3xl text-xl leading-relaxed text-muted-foreground">Create a live billboard for your city or network, with forecasts, weather and practical health guidance.</p>
              <Button asChild size="xl">
                <Link href="/billboard" target="_blank" rel="noopener noreferrer">Create a live billboard <ArrowRight size={22} /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 items-start gap-4" aria-label="AirQo billboard illustrations">
              <figure className="surface p-4">
                <Image src="/images/billboard/realistic/moderate-5.webp" alt="Woman checking air quality updates on her phone" width={360} height={360} className="aspect-square w-full object-contain" />
                <figcaption className="mt-3 text-center text-sm font-semibold">Check your air</figcaption>
              </figure>
              <figure className="surface p-4 mt-10">
                <Image src="/images/billboard/realistic/good-1.webp" alt="Runner enjoying outdoor activity" width={360} height={360} className="aspect-square w-full object-contain" />
                <figcaption className="mt-3 text-center text-sm font-semibold">Plan your day</figcaption>
              </figure>
            </div>
          </div>
        </Container>
      </Section>

      {/* How It Works Section */}
      <Section>
        <Container>
          <SectionHeading
            title="How AirQo AI Works"
            description="Our platform combines low-cost sensors, advanced algorithms, and user-friendly interfaces to democratize air quality monitoring."
          />
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {processCards.map((card) => (
              <ProcessCard key={card.number} {...card} />
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section muted>
        <Container>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Improve Air Quality?</h2>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-muted-foreground">
              Start using our AI-powered tools to make data-driven decisions for cleaner air.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="xl">
                <Link href="/map">Explore the Map <ArrowRight size={18} /></Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link href="/locate"><MapPin size={18} /> Try Site Locator</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </PageShell>
  )
}

export default Home
