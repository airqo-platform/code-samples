"use client"

import Link from "next/link"
import { ChevronLeft, BrainCircuit, LineChart, Sliders, MapPin, BarChart3, Shield } from "lucide-react"
import Navigation from "@/components/navigation/navigation"
import { Button } from "@/ui/button"

export default function AITechnologiesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
            <BrainCircuit className="h-4 w-4 mr-2" />
            Advanced Technology
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">AI Technologies at AirQo</h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            At AirQo, we leverage cutting-edge artificial intelligence to revolutionize air quality monitoring and
            management across Africa. Our AI solutions address unique challenges in data collection, analysis, and
            decision support.
          </p>
        </div>

        {/* Core AI Technologies Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-10 text-center">Our Core AI Technologies</h2>

          <div className="grid md:grid-cols-3 gap-10">
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
        </div>

        {/* Technical Approach Section */}
        <div className="bg-gray-50 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-6">Our Technical Approach</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Data Collection & Processing</h3>
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
              <h3 className="text-xl font-semibold mb-4">Model Development & Deployment</h3>
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
          <h2 className="text-2xl font-bold mb-8">Additional AI Applications</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start p-6 bg-white rounded-lg shadow-sm">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Anomaly Detection</h3>
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
                <h3 className="text-xl font-semibold mb-2">Health Impact Modeling</h3>
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
                <h3 className="text-xl font-semibold mb-2">Source Attribution</h3>
                <p className="text-gray-700">
                  Our AI algorithms help identify the likely sources of pollution by analyzing the composition of
                  pollutants, weather conditions, and other environmental factors.
                </p>
              </div>
            </div>

            <div className="flex items-start p-6 bg-white rounded-lg shadow-sm">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <LineChart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Intervention Analysis</h3>
                <p className="text-gray-700">
                  We use AI to evaluate the effectiveness of air quality interventions by comparing actual measurements
                  with counterfactual scenarios.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Future Developments */}
        <div className="bg-blue-50 p-8 rounded-xl text-center mb-16">
          <h2 className="text-2xl font-bold mb-4">Future AI Developments</h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-6">
            We're continuously advancing our AI capabilities to address emerging challenges in air quality management:
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Hyperlocal Forecasting</h3>
              <p className="text-gray-600">Street-level air quality predictions with sub-kilometer resolution</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Multi-pollutant Analysis</h3>
              <p className="text-gray-600">Integrated modeling of complex interactions between different pollutants</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Personalized Exposure</h3>
              <p className="text-gray-600">Individual exposure assessment based on movement patterns and activities</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-10 rounded-xl text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Experience Our AI in Action</h2>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Explore our suite of AI-powered tools and see how they can help you understand and improve air quality.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/map">
              <Button className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-lg font-medium">
                Explore the Map
              </Button>
            </Link>
            <Link href="/locate">
              <Button className="bg-transparent text-white hover:bg-white/10 border border-white px-8 py-4 rounded-lg font-medium">
                Try Site Locator
              </Button>
            </Link>
            <Link href="/categorize">
              <Button className="bg-transparent text-white hover:bg-white/10 border border-white px-8 py-4 rounded-lg font-medium">
                Use Categorization Tool
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          &copy; {new Date().getFullYear()} AirQo. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

