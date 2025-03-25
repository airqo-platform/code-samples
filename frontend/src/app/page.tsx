"use client"
import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MapPin, Wind, BarChart3, BrainCircuit, Shield } from "lucide-react"
import Navigation from "@/components/navigation/navigation"

const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen bg-blue-50 flex items-center p-8">
        <div className="absolute inset-0 bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-black space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                AI-Powered Air Quality Monitoring
              </h1>
              <p className="text-lg md:text-xl text-black-100">
                AirQo AI provides advanced tools for monitoring, analyzing, and optimizing air quality across African
                cities using artificial intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/map"
                  className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  Explore Air Quality Map <ArrowRight size={18} />
                </Link>
                <Link
                  href="/locate"
                  className="bg-blue-700 text-white hover:bg-blue-600 border border-blue-500 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  Try Site Locator
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div
                className="relative h-[500px] w-full max-w-[900px] rounded-xl overflow-hidden shadow-2xl mx-auto"
                onDoubleClick={() => (window.location.href = "/map")}
              >
                <Image
                  src="/images/homeMAP.png?height=2300&width=800"
                  alt="Air quality monitoring dashboard"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powered by Artificial Intelligence</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our platform leverages cutting-edge AI to provide accurate, real-time air quality data and insights for
              researchers, policymakers, and citizens.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<MapPin className="h-10 w-10 text-blue-500" />}
              title="Optimal Site Location"
              description="Use AI algorithms to determine the best locations for air quality monitors based on population density, pollution sources, and geographic factors."
            />
            <FeatureCard
              icon={<Wind className="h-10 w-10 text-blue-500" />}
              title="Air Quality Categorization"
              description="Automatically categorize monitoring sites based on surrounding land use, traffic patterns, and environmental factors."
            />
            <FeatureCard
              icon={<BarChart3 className="h-10 w-10 text-blue-500" />}
              title="Data Analytics"
              description="Generate comprehensive reports with trends, forecasts, and actionable insights from air quality data."
            />
            <FeatureCard
              icon={<BrainCircuit className="h-10 w-10 text-blue-500" />}
              title="Machine Learning Models"
              description="Continuously improving prediction models that account for seasonal variations, weather patterns, and human activities."
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-blue-500" />}
              title="Health Impact Assessment"
              description="Evaluate potential health impacts of air pollution on different population groups and geographic areas."
            />
            <FeatureCard
              icon={<MapPin className="h-10 w-10 text-blue-500" />}
              title="Interactive Mapping"
              description="Visualize air quality data across regions with interactive maps showing real-time pollution levels."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How AirQo AI Works</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our platform combines low-cost sensors, advanced algorithms, and user-friendly interfaces to democratize
              air quality monitoring.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard
              number="01"
              title="Data Collection"
              description="Our network of sensors continuously collects air quality data across multiple locations."
            />
            <StepCard
              number="02"
              title="AI Processing"
              description="Advanced algorithms clean, analyze, and interpret the data to generate insights."
            />
            <StepCard
              number="03"
              title="Actionable Insights"
              description="Users access visualizations, reports, and recommendations through our platform."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-20 bg-blue-50 text-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Improve Air Quality?</h2>
          <p className="text-xl text-black-100 max-w-3xl mx-auto mb-8">
            Start using our AI-powered tools to make data-driven decisions for cleaner air.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/map"
              className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-lg font-medium transition-colors"
            >
              Explore the Map
            </Link>
            <Link
              href="/locate"
              className="bg-blue-700 text-white hover:bg-blue-600 border border-blue-500 px-8 py-4 rounded-lg font-medium transition-colors"
            >
              Try Site Locator
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-50 p-8 rounded-lg mb-12">
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          &copy; {new Date().getFullYear()} AirQo. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

// Step Card Component
const StepCard = ({ number, title, description }: { number: string; title: string; description: string }) => {
  return (
    <div className="text-center p-6">
      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

export default Home

