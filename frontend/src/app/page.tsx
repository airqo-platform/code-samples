import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Map, BarChart2, FileText, Info } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Empowering Air Quality Monitoring with AI</h1>
              <p className="text-xl mb-8">
                Innovative solutions for better air quality monitoring, forecasting, and analysis using cutting-edge AI
                technologies.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                  <Link href="/map">View Air Quality Map</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-blue-700">
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md h-80">
                <Image
                  src="/placeholder.svg?height=400&width=600&text=Air+Quality+Monitoring"
                  alt="Air Quality Monitoring"
                  fill
                  className="object-cover rounded-lg shadow-lg"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Key Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how our AI-powered platform can revolutionize air quality monitoring and analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Map className="text-blue-600 h-6 w-6" />
                </div>
                <CardTitle>Interactive Air Quality Map</CardTitle>
                <CardDescription>Visualize real-time air quality data across different regions.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our interactive map provides real-time air quality information with intuitive color-coding and
                  detailed pollutant data.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline">
                  <Link href="/map">View Map</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Feature 2 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="text-green-600 h-6 w-6" />
                </div>
                <CardTitle>Optimal Site Location</CardTitle>
                <CardDescription>Find the best locations for air quality monitors.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our AI algorithms help determine the most effective places to position air quality monitors based on
                  various factors.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline">
                  <Link href="/locate">Locate Monitors</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Feature 3 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BarChart2 className="text-purple-600 h-6 w-6" />
                </div>
                <CardTitle>Air Quality Categorization</CardTitle>
                <CardDescription>Categorize air quality based on various pollutants and standards.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our platform categorizes air quality according to international standards and provides health
                  recommendations.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline">
                  <Link href="/categorize">Categorize Air Quality</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Feature 4 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="text-red-600 h-6 w-6" />
                </div>
                <CardTitle>Comprehensive Reports</CardTitle>
                <CardDescription>Generate detailed reports on air quality trends and patterns.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Access comprehensive reports with insights on air quality trends, pollutant levels, and health
                  impacts.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline">
                  <Link href="/reports">View Reports</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Feature 5 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Info className="text-yellow-600 h-6 w-6" />
                </div>
                <CardTitle>About Our Technology</CardTitle>
                <CardDescription>
                  Learn about the technology behind our air quality monitoring platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Discover the innovative AI technologies and methodologies that power our air quality monitoring
                  solutions.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline">
                  <Link href="/about">Learn More</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to improve air quality monitoring?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join organizations worldwide that are using our AI-powered platform to make a difference in air quality
            monitoring and public health.
          </p>
          <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
            <Link href="/signup">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

