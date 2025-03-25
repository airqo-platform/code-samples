"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MapPin, ChevronLeft } from "lucide-react"
import Navigation from "@/components/navigation/navigation"
import { Button } from "@/ui/button"

export default function SiteLocationFeature() {
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
              <MapPin className="h-4 w-4 mr-2" />
              Feature
            </div>
            <h1 className="text-4xl font-bold mb-6">Optimal Site Location</h1>
            <p className="text-lg text-gray-700 mb-6">
              Our AI-powered site location tool helps you determine the most effective places to position air quality
              monitors based on population density, pollution sources, and geographic factors.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/locate">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center">
                  Try Site Locator
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
              src="/images/site-location.jpg"
              alt="Optimal site location visualization"
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
          <h2 className="text-2xl font-bold mb-6">Location AI Technology</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-lg text-gray-700 mb-4">
                Our Location AI uses advanced spatial optimization algorithms to identify the most strategic positions
                for air quality monitors. The system considers multiple factors:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Population density and distribution patterns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Known pollution sources and emission patterns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Geographical features that affect air flow</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Existing infrastructure and accessibility</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Coverage optimization to minimize redundancy</span>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-lg text-gray-700 mb-4">
                The AI model has been trained on extensive datasets from across Africa, including:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Historical air quality measurements from existing networks</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Satellite-derived pollution estimates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Urban development and land use patterns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 font-bold">•</span>
                  <span>Demographic and population data</span>
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
              <h3 className="text-xl font-semibold mb-2">Define Your Area</h3>
              <p className="text-gray-600">
                Draw a polygon on the map or search for a location to define your area of interest.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Set Parameters</h3>
              <p className="text-gray-600">Specify the number of sensors and minimum distance between them.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Optimal Locations</h3>
              <p className="text-gray-600">
                Our AI algorithm will suggest the best locations for your air quality monitors.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Key Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Maximize Coverage</h3>
                <p className="text-gray-600">
                  Ensure your monitoring network covers the most critical areas with minimal redundancy.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Cost Efficiency</h3>
                <p className="text-gray-600">
                  Optimize your resources by placing sensors where they'll provide the most valuable data.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Data-Driven Decisions</h3>
                <p className="text-gray-600">
                  Base your deployment strategy on scientific analysis rather than guesswork.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Customizable Constraints</h3>
                <p className="text-gray-600">
                  Add must-have locations and set minimum distances to meet your specific requirements.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-8 rounded-xl text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to find the optimal locations for your air quality monitors?
          </h2>
          <Link href="/locate">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium mt-4">
              Try Site Locator Now
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

