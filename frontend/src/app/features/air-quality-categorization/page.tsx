"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Wind, ChevronLeft } from "lucide-react"
import Navigation from "@/components/navigation/navigation"
import { Button } from "@/ui/button"

export default function AirQualityCategorizationFeature() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
              <Wind className="h-4 w-4 mr-2" />
              Feature
            </div>
            <h1 className="text-4xl font-bold mb-6">Air Quality Categorization</h1>
            <p className="text-lg text-gray-700 mb-6">
              Our advanced categorization system automatically classifies monitoring sites based on surrounding land
              use, traffic patterns, and environmental factors to provide context for your air quality data.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/categorize">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center">
                  Try Categorization Tool
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/#ai-technologies">
                <Button variant="outline" className="px-6 py-3 rounded-lg font-medium inline-flex items-center">
                  Learn About Our AI
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative h-[400px] rounded-xl overflow-hidden shadow-xl">
            <Image
              src="/images/air-quality-categorization.jpg"
              alt="Air quality categorization visualization"
              fill
              className="object-cover"
              onError={(e) => {
                // Fallback if image doesn't exist
                e.currentTarget.src = "/placeholder.svg?height=400&width=600"
              }}
            />
          </div>
        </div>

        {/* AI Technology Section */}
        <div className="bg-blue-50 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Categorization AI Technology</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-lg text-gray-700 mb-4">
                Our Categorization AI uses machine learning to classify monitoring sites based on their surroundings.
                The system analyzes:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Land use patterns (residential, commercial, industrial)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Proximity to roads and traffic density</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Natural features like vegetation and water bodies</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Building density and urban morphology</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Known pollution sources in the vicinity</span>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-lg text-gray-700 mb-4">
                The AI model categorizes sites into standardized classes including:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>
                    <strong>Urban Background:</strong> Residential areas away from major roads
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>
                    <strong>Urban Traffic:</strong> Sites near major roads with high traffic
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>
                    <strong>Industrial:</strong> Areas dominated by industrial activities
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>
                    <strong>Rural:</strong> Areas with minimal human influence
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>
                    <strong>Mixed Use:</strong> Areas with multiple land use types
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Select Locations</h3>
              <p className="text-gray-600">
                Click on the map, upload coordinates, or enter them manually to select locations for categorization.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes the surrounding area using OpenStreetMap data and environmental factors.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Categorization</h3>
              <p className="text-gray-600">
                Receive detailed categorization for each location, including area type and land use.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Key Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <Wind className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Contextual Understanding</h3>
                <p className="text-gray-600">
                  Understand the context of your air quality readings based on the surrounding environment.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <Wind className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Standardized Classification</h3>
                <p className="text-gray-600">
                  Use consistent categories across your monitoring network for better comparability.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <Wind className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Batch Processing</h3>
                <p className="text-gray-600">Categorize multiple locations at once, saving time and effort.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <Wind className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Data Export</h3>
                <p className="text-gray-600">
                  Export categorization results as CSV for further analysis or integration with other tools.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-8 rounded-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to categorize your air quality monitoring sites?</h2>
          <Link href="/categorize">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium mt-4">
              Try Categorization Tool Now
            </Button>
          </Link>
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

