"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Loader2, Save } from "lucide-react"

export default function LocatePage() {
  const [isCalculating, setIsCalculating] = useState(false)
  const [resultsReady, setResultsReady] = useState(false)
  const [numSensors, setNumSensors] = useState(5)

  const handleCalculate = () => {
    setIsCalculating(true)
    // Simulate API call
    setTimeout(() => {
      setIsCalculating(false)
      setResultsReady(true)
    }, 2000)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="bg-blue-700 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Optimal Site Location</h1>
          <p className="text-lg">Use AI algorithms to determine the best locations for air quality monitors</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 flex-1">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Control Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Location Parameters</CardTitle>
                  <CardDescription>Configure the parameters for optimal site location</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="area">Target Area</Label>
                    <Select defaultValue="city">
                      <SelectTrigger id="area">
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="city">Entire City</SelectItem>
                        <SelectItem value="downtown">Downtown</SelectItem>
                        <SelectItem value="residential">Residential Areas</SelectItem>
                        <SelectItem value="industrial">Industrial Zone</SelectItem>
                        <SelectItem value="custom">Custom (Draw on Map)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="num-sensors">Number of Sensors</Label>
                      <span className="text-sm font-medium">{numSensors}</span>
                    </div>
                    <Slider
                      id="num-sensors"
                      min={1}
                      max={20}
                      step={1}
                      value={[numSensors]}
                      onValueChange={(value) => setNumSensors(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-distance">Minimum Distance Between Sensors (m)</Label>
                    <Input id="min-distance" type="number" defaultValue="500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Optimization Priority</Label>
                    <Select defaultValue="balanced">
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="population">Population Density</SelectItem>
                        <SelectItem value="pollution">Pollution Sources</SelectItem>
                        <SelectItem value="balanced">Balanced Approach</SelectItem>
                        <SelectItem value="coverage">Maximum Coverage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Additional Constraints</Label>
                    <div className="flex items-center space-x-2">
                      <Switch id="constraint-schools" />
                      <Label htmlFor="constraint-schools">Include Schools</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="constraint-hospitals" />
                      <Label htmlFor="constraint-hospitals">Include Hospitals</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="constraint-traffic" defaultChecked />
                      <Label htmlFor="constraint-traffic">Consider Traffic Patterns</Label>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={handleCalculate} disabled={isCalculating}>
                    {isCalculating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      "Calculate Optimal Locations"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Map and Results */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="map">
                <TabsList className="mb-4">
                  <TabsTrigger value="map">Map View</TabsTrigger>
                  <TabsTrigger value="results" disabled={!resultsReady}>
                    Results
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="map">
                  <Card>
                    <CardContent className="p-0">
                      <div className="h-[500px] bg-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-medium text-gray-600 mb-2">Map Visualization</h3>
                          <p className="text-gray-500 max-w-md mx-auto">
                            In a real implementation, this area would display an interactive map where you can select
                            areas and view recommended sensor locations.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="results">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recommended Sensor Locations</CardTitle>
                      <CardDescription>
                        Based on your parameters, we recommend the following {numSensors} locations for optimal coverage
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Array.from({ length: numSensors }).map((_, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-100"
                          >
                            <div className="flex items-center">
                              <MapPin className="h-5 w-5 text-blue-500 mr-2" />
                              <div>
                                <h4 className="font-medium">Location {index + 1}</h4>
                                <p className="text-sm text-gray-600">
                                  {index % 3 === 0
                                    ? "High traffic intersection"
                                    : index % 3 === 1
                                      ? "Residential area"
                                      : "Commercial district"}
                                </p>
                              </div>
                            </div>
                            <div className="text-blue-500 font-medium">
                              {(Math.random() * 100).toFixed(6)}°N, {(Math.random() * 100).toFixed(6)}°E
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">Export Results</Button>
                      <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Save Configuration
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-700 text-2xl font-bold">1</span>
                </div>
                <CardTitle>Define Your Area</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Select a predefined area or draw a custom polygon on the map to define your area of interest.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-700 text-2xl font-bold">2</span>
                </div>
                <CardTitle>Set Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Specify the number of sensors, minimum distance between them, and optimization priorities.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-700 text-2xl font-bold">3</span>
                </div>
                <CardTitle>Get Optimal Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our AI algorithm will suggest the best locations for your air quality monitors based on your
                  parameters.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

