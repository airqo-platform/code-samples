import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function SiteLocationPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Optimal Site Location</h1>
              <p className="text-xl mb-8">
                Use AI algorithms to determine the best locations for air quality monitors based on population density,
                pollution sources, and geographic factors.
              </p>
              <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                <Link href="/contact">Get Started</Link>
              </Button>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md h-80">
                <Image
                  src="/placeholder.svg?height=400&width=600&text=Site+Location"
                  alt="Optimal Site Location"
                  fill
                  className="object-cover rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered site location tool helps you determine the most effective places to position air quality
              monitors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-700 text-2xl font-bold">1</span>
              </div>
              <CardContent className="p-0">
                <h3 className="text-xl font-bold mb-2">Define Your Area</h3>
                <p className="text-gray-600">
                  Draw a polygon on the map or search for a location to define your area of interest.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-700 text-2xl font-bold">2</span>
              </div>
              <CardContent className="p-0">
                <h3 className="text-xl font-bold mb-2">Set Parameters</h3>
                <p className="text-gray-600">Specify the number of sensors and minimum distance between them.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-700 text-2xl font-bold">3</span>
              </div>
              <CardContent className="p-0">
                <h3 className="text-xl font-bold mb-2">Get Optimal Locations</h3>
                <p className="text-gray-600">
                  Our AI algorithm will suggest the best locations for your air quality monitors.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Key Benefits</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Why our AI-powered site location tool is essential for effective air quality monitoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Maximize Coverage</h3>
                <p className="text-gray-600">
                  Ensure your monitoring network covers the most critical areas with minimal redundancy.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Cost Efficiency</h3>
                <p className="text-gray-600">
                  Optimize your resources by placing sensors where they&#39;ll provide the most valuable data.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Data-Driven Decisions</h3>
                <p className="text-gray-600">
                  Base your deployment strategy on scientific analysis rather than guesswork.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Customizable Constraints</h3>
                <p className="text-gray-600">
                  Add must-have locations and set minimum distances to meet your specific requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to find the optimal locations for your air quality monitors?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join organizations worldwide that are using our AI-powered platform to make a difference in air quality
            monitoring and public health.
          </p>
          <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
            <Link href="/contact">Try Site Locator Now</Link>
          </Button>
        </div>
      </section>

      {/* Related Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Related Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore other features that complement our Optimal Site Location tool.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <div className="relative w-full h-48">
                <Image
                  src="/placeholder.svg?height=200&width=400&text=Data+Analysis"
                  alt="Data Analysis"
                  fill
                  className="object-cover rounded-t-lg"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Data Analysis</h3>
                <p className="text-gray-600 mb-4">Analyze the data collected from your optimally placed monitors.</p>
                <Button asChild variant="outline">
                  <Link href="/features/data-analysis">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <div className="relative w-full h-48">
                <Image
                  src="/placeholder.svg?height=200&width=400&text=Calibration+Tools"
                  alt="Calibration Tools"
                  fill
                  className="object-cover rounded-t-lg"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Calibration Tools</h3>
                <p className="text-gray-600 mb-4">
                  Ensure your monitors are properly calibrated for accurate readings.
                </p>
                <Button asChild variant="outline">
                  <Link href="/features/calibration">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <div className="relative w-full h-48">
                <Image
                  src="/placeholder.svg?height=200&width=400&text=AI+Technologies"
                  alt="AI Technologies"
                  fill
                  className="object-cover rounded-t-lg"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">AI Technologies</h3>
                <p className="text-gray-600 mb-4">Learn more about the AI technologies powering our platform.</p>
                <Button asChild variant="outline">
                  <Link href="/features/ai-technologies">Learn More</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

