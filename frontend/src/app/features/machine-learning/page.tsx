"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BrainCircuit, ChevronLeft } from "lucide-react"
import Navigation from "@/components/navigation/navigation"
import { Button } from "@/ui/button"

export default function MachineLearningFeature() {
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
              <BrainCircuit className="h-4 w-4 mr-2" />
              Feature
            </div>
            <h1 className="text-4xl font-bold mb-6">Machine Learning Models</h1>
            <p className="text-lg text-gray-700 mb-6">
              Our continuously improving prediction models account for seasonal variations, weather patterns, and human
              activities to provide accurate air quality forecasts and insights.
            </p>
            <Link href="/reports">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center">
                Explore ML Capabilities
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="relative h-[400px] rounded-xl overflow-hidden shadow-xl">
            <Image
              src="/images/machine-learning.jpg"
              alt="Machine learning visualization"
              fill
              className="object-cover"
              onError={(e) => {
                // Fallback if image doesn't exist
                e.currentTarget.src = "/placeholder.svg?height=400&width=600"
              }}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Data Collection</h3>
              <p className="text-gray-600">
                Our system collects vast amounts of air quality data along with weather, traffic, and other
                environmental factors.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Model Training</h3>
              <p className="text-gray-600">
                Advanced machine learning algorithms learn patterns and relationships in the data.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Prediction & Insights</h3>
              <p className="text-gray-600">
                The trained models generate accurate forecasts and extract meaningful insights from the data.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Key Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <BrainCircuit className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Accurate Forecasting</h3>
                <p className="text-gray-600">Predict air quality conditions days in advance with high accuracy.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <BrainCircuit className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Pattern Recognition</h3>
                <p className="text-gray-600">
                  Identify complex patterns and relationships that might not be obvious through traditional analysis.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <BrainCircuit className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Continuous Improvement</h3>
                <p className="text-gray-600">Our models learn and improve over time as more data becomes available.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <BrainCircuit className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Factor Analysis</h3>
                <p className="text-gray-600">
                  Understand which factors have the greatest impact on air quality in different contexts.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-8 rounded-xl text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to leverage the power of machine learning for air quality analysis?
          </h2>
          <Link href="/reports">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium mt-4">
              Explore ML Capabilities Now
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

