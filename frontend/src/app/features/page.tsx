import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Wind, BarChart3, BrainCircuit, Shield, Sliders } from "lucide-react"

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Features</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Discover the powerful features of our AI-powered air quality monitoring platform.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="text-blue-600 h-6 w-6" />
                </div>
                <CardTitle>Optimal Site Location</CardTitle>
                <CardDescription>
                  Use AI algorithms to determine the best locations for air quality monitors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-48 mb-4">
                  <Image
                    src="/placeholder.svg?height=200&width=400&text=Site+Location"
                    alt="Optimal Site Location"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <p className="text-gray-600">
                  Our AI analyzes population density, pollution sources, and geographic factors to recommend optimal
                  monitoring locations.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href="/features/site-location">Learn More</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Feature 2 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Wind className="text-green-600 h-6 w-6" />
                </div>
                <CardTitle>Air Quality Forecasting</CardTitle>
                <CardDescription>Predict air quality conditions with advanced machine learning models.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-48 mb-4">
                  <Image
                    src="/placeholder.svg?height=200&width=400&text=Forecasting"
                    alt="Air Quality Forecasting"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <p className="text-gray-600">
                  Get accurate forecasts up to 72 hours in advance to help communities prepare for changing air quality
                  conditions.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href="/features/forecasting">Learn More</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Feature 3 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="text-purple-600 h-6 w-6" />
                </div>
                <CardTitle>Data Analysis</CardTitle>
                <CardDescription>Gain insights from comprehensive air quality data analysis.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-48 mb-4">
                  <Image
                    src="/placeholder.svg?height=200&width=400&text=Data+Analysis"
                    alt="Data Analysis"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <p className="text-gray-600">
                  Our platform provides powerful tools for analyzing trends, identifying patterns, and understanding air
                  quality impacts.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href="/features/data-analysis">Learn More</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Feature 4 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BrainCircuit className="text-red-600 h-6 w-6" />
                </div>
                <CardTitle>AI Technologies</CardTitle>
                <CardDescription>Cutting-edge AI technologies powering our platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-48 mb-4">
                  <Image
                    src="/placeholder.svg?height=200&width=400&text=AI+Technologies"
                    alt="AI Technologies"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <p className="text-gray-600">
                  Explore the advanced AI and machine learning technologies that make our air quality solutions
                  possible.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href="/features/ai-technologies">Learn More</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Feature 5 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="text-yellow-600 h-6 w-6" />
                </div>
                <CardTitle>Health Impact Assessment</CardTitle>
                <CardDescription>Understand the health implications of air quality data.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-48 mb-4">
                  <Image
                    src="/placeholder.svg?height=200&width=400&text=Health+Impact"
                    alt="Health Impact Assessment"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <p className="text-gray-600">
                  Our platform helps assess potential health impacts of air pollution and provides actionable
                  recommendations.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href="/features/health-impact">Learn More</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Feature 6 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-teal-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Sliders className="text-teal-600 h-6 w-6" />
                </div>
                <CardTitle>Calibration Tools</CardTitle>
                <CardDescription>Ensure accurate readings with AI-assisted calibration.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-48 mb-4">
                  <Image
                    src="/placeholder.svg?height=200&width=400&text=Calibration+Tools"
                    alt="Calibration Tools"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <p className="text-gray-600">
                  Our AI tools help calibrate low-cost sensors against reference monitors for more reliable
                  measurements.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href="/features/calibration">Learn More</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join organizations worldwide that are using our AI-powered platform to make a difference in air quality
            monitoring and public health.
          </p>
          <Button asChild size="lg">
            <Link href="/contact">Contact Us Today</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

