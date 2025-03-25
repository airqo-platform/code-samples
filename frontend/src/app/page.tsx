"use client"
import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MapPin, Wind, BarChart3, BrainCircuit, Shield, Sliders, LineChart, Zap } from "lucide-react"
import Navigation from "@/components/navigation/navigation"
import { Button } from "@/ui/button"

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
                <Image src="/images/homeMAP.png" alt="Air quality monitoring dashboard" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Technologies Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
              <BrainCircuit className="h-4 w-4 mr-2" />
              Advanced Technology
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our AI Technologies</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              At AirQo, we've developed specialized AI solutions to address the unique challenges of air quality
              monitoring in Africa. Our cutting-edge technologies power all aspects of our platform.
            </p>
          </div>

          {/* Core AI Technologies */}
          <div className="grid md:grid-cols-3 gap-10 mb-16">
            {/* Forecasting AI */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:scale-105">
              <div className="relative h-48 bg-blue-600">
                <div className="absolute inset-0 flex items-center justify-center">
                  <LineChart className="h-20 w-20 text-white opacity-30" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900 to-transparent h-1/2"></div>
                <div className="absolute bottom-4 left-6">
                  <h3 className="text-2xl font-bold text-white">Forecasting AI</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Our forecasting AI predicts air quality conditions up to 7 days in advance with high accuracy. Using
                  recurrent neural networks and ensemble methods, we analyze historical air quality data, weather
                  patterns, and human activity to generate reliable forecasts.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Time-series prediction models</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Weather data integration</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Seasonal pattern recognition</span>
                  </li>
                </ul>
                <Link href="/reports">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Explore Forecasting</Button>
                </Link>
              </div>
            </div>

            {/* Calibration AI */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:scale-105">
              <div className="relative h-48 bg-green-600">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sliders className="h-20 w-20 text-white opacity-30" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-900 to-transparent h-1/2"></div>
                <div className="absolute bottom-4 left-6">
                  <h3 className="text-2xl font-bold text-white">Calibration AI</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Our calibration AI transforms data from low-cost sensors into reference-grade measurements. Using
                  advanced machine learning algorithms, we account for environmental factors, sensor drift, and
                  cross-sensitivities to ensure accurate readings.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>Adaptive calibration models</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>Environmental compensation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>Sensor drift correction</span>
                  </li>
                </ul>
                <Link href="/map">
                  <Button className="w-full bg-green-600 hover:bg-green-700">See Calibrated Data</Button>
                </Link>
              </div>
            </div>

            {/* Location AI */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:scale-105">
              <div className="relative h-48 bg-purple-600">
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="h-20 w-20 text-white opacity-30" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-900 to-transparent h-1/2"></div>
                <div className="absolute bottom-4 left-6">
                  <h3 className="text-2xl font-bold text-white">Location AI</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Our location AI optimizes the placement of air quality monitors to maximize coverage and data value.
                  Using spatial analysis, population density, and pollution source modeling, we identify the most
                  strategic locations for monitoring networks.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span>Spatial optimization algorithms</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span>Population exposure modeling</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span>Geographic constraint handling</span>
                  </li>
                </ul>
                <Link href="/locate">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">Try Location AI</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Technical Approach */}
          <div className="bg-white rounded-xl p-8 shadow-md mb-16">
            <h3 className="text-2xl font-bold mb-6">Our Technical Approach</h3>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-semibold mb-4">Data Collection & Processing</h4>
                <p className="text-gray-700 mb-4">Our AI systems process data from multiple sources, including:</p>
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Low-cost sensor networks deployed across Africa</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Satellite imagery and remote sensing data</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Weather and meteorological information</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Traffic patterns and urban activity data</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-4">Model Development & Deployment</h4>
                <p className="text-gray-700 mb-4">We employ a rigorous approach to AI model development:</p>
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Continuous training with expanding datasets</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Regular validation against reference instruments</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Adaptation to local environmental conditions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Edge deployment for low-connectivity areas</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Additional AI Applications */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center">Additional AI Applications</h3>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start p-6 bg-white rounded-lg shadow-sm">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Anomaly Detection</h4>
                  <p className="text-gray-700">
                    Our AI systems automatically identify unusual patterns in air quality data, flagging potential
                    pollution events, sensor malfunctions, or data quality issues for investigation.
                  </p>
                </div>
              </div>

              <div className="flex items-start p-6 bg-white rounded-lg shadow-sm">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Health Impact Modeling</h4>
                  <p className="text-gray-700">
                    We use AI to model the relationship between air pollution exposure and health outcomes, helping to
                    quantify the impact of air quality interventions on public health.
                  </p>
                </div>
              </div>

              <div className="flex items-start p-6 bg-white rounded-lg shadow-sm">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <BrainCircuit className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Source Attribution</h4>
                  <p className="text-gray-700">
                    Our AI algorithms help identify the likely sources of pollution by analyzing the composition of
                    pollutants, weather conditions, and other environmental factors.
                  </p>
                </div>
              </div>

              <div className="flex items-start p-6 bg-white rounded-lg shadow-sm">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Intervention Analysis</h4>
                  <p className="text-gray-700">
                    We use AI to evaluate the effectiveness of air quality interventions by comparing actual
                    measurements with counterfactual scenarios.
                  </p>
                </div>
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
            <Link href="/features/site-location">
              <FeatureCard
                icon={<MapPin className="h-10 w-10 text-blue-500" />}
                title="Optimal Site Location"
                description="Use AI algorithms to determine the best locations for air quality monitors based on population density, pollution sources, and geographic factors."
              />
            </Link>
            <Link href="/features/air-quality-categorization">
              <FeatureCard
                icon={<Wind className="h-10 w-10 text-blue-500" />}
                title="Air Quality Categorization"
                description="Automatically categorize monitoring sites based on surrounding land use, traffic patterns, and environmental factors."
              />
            </Link>
            <Link href="/features/data-analytics">
              <FeatureCard
                icon={<BarChart3 className="h-10 w-10 text-blue-500" />}
                title="Data Analytics"
                description="Generate comprehensive reports with trends, forecasts, and actionable insights from air quality data."
              />
            </Link>
            <Link href="/features/machine-learning">
              <FeatureCard
                icon={<BrainCircuit className="h-10 w-10 text-blue-500" />}
                title="Machine Learning Models"
                description="Continuously improving prediction models that account for seasonal variations, weather patterns, and human activities."
              />
            </Link>
            <Link href="/features/health-impact">
              <FeatureCard
                icon={<Shield className="h-10 w-10 text-blue-500" />}
                title="Health Impact Assessment"
                description="Evaluate potential health impacts of air pollution on different population groups and geographic areas."
              />
            </Link>
            <Link href="/features/interactive-mapping">
              <FeatureCard
                icon={<MapPin className="h-10 w-10 text-blue-500" />}
                title="Interactive Mapping"
                description="Visualize air quality data across regions with interactive maps showing real-time pollution levels."
              />
            </Link>
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

// Feature Card Component - Updated to be clickable
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
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

