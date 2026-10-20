"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Code2, MapPin, Wind, BarChart3, BrainCircuit, Shield, Database, Cpu, LineChart } from "lucide-react"
import { PageShell } from "@/components/layout/page-shell"
import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/layout/section-heading"
import { FeatureCard } from "@/components/marketing/feature-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  { icon: <Database className="h-5 w-5 text-primary" />, number: "01", title: "Data Collection", description: "Our network of sensors continuously collects air quality data across multiple locations.", imageSrc: "/images/model/calibration-header.webp" },
  { icon: <Cpu className="h-5 w-5 text-primary" />, number: "02", title: "AI Processing", description: "Advanced algorithms clean, analyze, and interpret the data to generate insights.", imageSrc: "/images/model/modelapi.webp" },
  { icon: <LineChart className="h-5 w-5 text-primary" />, number: "03", title: "Actionable Insights", description: "Users access visualizations, reports, and recommendations through our various platform.", imageSrc: "/images/model/analyticsHome.webp" },
]

const Home: React.FC = () => {
  return (
    <PageShell>
      {/* Hero Section */}
      <Section compact className="bg-muted/40">
        <Container>
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="max-w-3xl space-y-5">
              <Badge variant="accent">AirQo AI</Badge>
              <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
                AI-Powered Air Quality Monitoring
              </h1>
              <p className="text-base leading-7 text-muted-foreground">
                AirQo AI provides advanced tools for monitoring, analyzing, and optimizing air quality across African
                cities using artificial intelligence.
              </p>
              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/map">Explore Air Quality Map <ArrowRight size={16} /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#embed-map"><Code2 size={16} /> Embed on your website</a>
                </Button>
              </div>
            </div>
            <Link
              href="/map"
              aria-label="Open the AirQo air quality map"
              className="group relative block aspect-[16/10] w-full overflow-hidden rounded-md border border-border bg-card"
            >
              <Image
                src="/images/homemap.webp"
                alt="Air quality monitoring dashboard"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
          </div>
        </Container>
      </Section>

      {/* Key Features Section */}
      <Section>
        <Container>
          <SectionHeading
            title="Powered by Artificial Intelligence"
            description="Our platform leverages cutting-edge AI to provide accurate, real-time air quality data and insights for researchers, policymakers, and citizens."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="max-w-2xl text-2xl font-medium tracking-tight md:text-3xl">Bring air quality to the big screen</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Create a live billboard for your city or network, with forecasts, weather and practical health guidance.</p>
              <div className="mt-6">
                <Button asChild size="lg">
                  <Link href="/billboard" target="_blank" rel="noopener noreferrer">Create a live billboard <ArrowRight size={16} /></Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 items-start gap-4" aria-label="AirQo billboard illustrations">
              <figure className="m-0 rounded-md border border-border bg-card p-4">
                <Image src="/images/billboard/realistic/moderate-5.webp" alt="Woman checking air quality updates on her phone" width={360} height={360} className="aspect-square w-full object-contain" />
                <figcaption className="mt-3 text-center text-sm font-medium">Check your air</figcaption>
              </figure>
              <figure className="m-0 rounded-md border border-border bg-card p-4">
                <Image src="/images/billboard/realistic/good-1.webp" alt="Runner enjoying outdoor activity" width={360} height={360} className="aspect-square w-full object-contain" />
                <figcaption className="mt-3 text-center text-sm font-medium">Plan your day</figcaption>
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
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {processCards.map((card) => (
              <ProcessCard key={card.number} {...card} />
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section muted>
        <Container>
          <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-6 text-center shadow-sm sm:p-8">
            <h2 className="text-2xl font-medium tracking-tight">Ready to Improve Air Quality?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Start using our AI-powered tools to make data-driven decisions for cleaner air.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/map">Explore the Map <ArrowRight size={16} /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/locate"><MapPin size={16} /> Try Site Locator</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </PageShell>
  )
}

export default Home
