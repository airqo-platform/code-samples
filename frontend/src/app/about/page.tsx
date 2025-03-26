import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About AirQo</h1>
          <p className="text-xl max-w-3xl mx-auto">
            We&apos;re on a mission to improve air quality monitoring through innovative AI technologies.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-lg text-gray-700 mb-6">
                AirQo was founded with a simple yet powerful vision: to make air quality data more accessible, accurate,
                and actionable. We recognized that traditional air quality monitoring methods were often expensive,
                limited in coverage, and difficult to scale.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Our team of environmental scientists, data experts, and AI specialists came together to develop
                innovative solutions that leverage artificial intelligence to transform how air quality is monitored and
                analyzed.
              </p>
              <p className="text-lg text-gray-700">
                Today, we&apos;re proud to offer a comprehensive platform that helps organizations around the world make
                data-driven decisions about air quality monitoring, public health interventions, and environmental
                policies.
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="/placeholder.svg?height=500&width=800&text=Our+Story"
                  alt="AirQo Team"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Technology */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Technology</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the innovative AI technologies powering our air quality monitoring platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
                <CardTitle>Machine Learning Models</CardTitle>
                <CardDescription>Advanced algorithms for accurate predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our platform utilizes state-of-the-art machine learning models to analyze air quality data, identify
                  patterns, and make accurate predictions about future air quality conditions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <CardTitle>Spatial Analysis</CardTitle>
                <CardDescription>Comprehensive spatial data processing</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our spatial analysis tools help identify optimal locations for air quality monitors, analyze pollution
                  dispersion patterns, and create detailed air quality maps for any region.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                    />
                  </svg>
                </div>
                <CardTitle>Data Analytics</CardTitle>
                <CardDescription>Powerful tools for data-driven insights</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our analytics engine processes vast amounts of air quality data to provide actionable insights,
                  identify trends, and help organizations make informed decisions about air quality management.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet the passionate experts behind AirQo&apos;s innovative air quality solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Team Member 1 */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden">
                <Image
                  src="/placeholder.svg?height=200&width=200&text=Team+Member"
                  alt="Team Member"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold">Dr. Jane Smith</h3>
              <p className="text-gray-600">Founder & CEO</p>
            </div>

            {/* Team Member 2 */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden">
                <Image
                  src="/placeholder.svg?height=200&width=200&text=Team+Member"
                  alt="Team Member"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold">Dr. Michael Johnson</h3>
              <p className="text-gray-600">Chief Scientific Officer</p>
            </div>

            {/* Team Member 3 */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden">
                <Image
                  src="/placeholder.svg?height=200&width=200&text=Team+Member"
                  alt="Team Member"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold">Sarah Chen</h3>
              <p className="text-gray-600">AI Research Director</p>
            </div>

            {/* Team Member 4 */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden">
                <Image
                  src="/placeholder.svg?height=200&width=200&text=Team+Member"
                  alt="Team Member"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold">David Okonkwo</h3>
              <p className="text-gray-600">Head of Engineering</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Partners */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Partners</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We collaborate with leading organizations to advance air quality monitoring worldwide.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-32">
              <div className="relative w-full h-16">
                <Image
                  src="/placeholder.svg?height=100&width=200&text=Partner+Logo"
                  alt="Partner Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-32">
              <div className="relative w-full h-16">
                <Image
                  src="/placeholder.svg?height=100&width=200&text=Partner+Logo"
                  alt="Partner Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-32">
              <div className="relative w-full h-16">
                <Image
                  src="/placeholder.svg?height=100&width=200&text=Partner+Logo"
                  alt="Partner Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-32">
              <div className="relative w-full h-16">
                <Image
                  src="/placeholder.svg?height=100&width=200&text=Partner+Logo"
                  alt="Partner Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join us in our mission</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Whether you&apos;re looking to implement our solutions, partner with us, or join our team, we&apos;d love to
            hear from you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-blue-800">
              <Link href="/careers">Join Our Team</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

