"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle, CheckCircle, Info } from "lucide-react"

export default function CategorizePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [resultsReady, setResultsReady] = useState(false)
  const [standard, setStandard] = useState("who")

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    // Simulate API call
    setTimeout(() => {
      setIsAnalyzing(false)
      setResultsReady(true)
    }, 2000)
  }

  const getBadgeVariant = (category: string) => {
    switch (category) {
      case "Good":
        return "outline"
      case "Moderate":
        return "secondary"
      case "Unhealthy for Sensitive Groups":
        return "warning"
      case "Unhealthy":
        return "destructive"
      case "Very Unhealthy":
        return "destructive"
      case "Hazardous":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getBadgeIcon = (category: string) => {
    switch (category) {
      case "Good":
        return <CheckCircle className="h-4 w-4 mr-1" />
      case "Moderate":
        return <Info className="h-4 w-4 mr-1" />
      case "Unhealthy for Sensitive Groups":
      case "Unhealthy":
      case "Very Unhealthy":
      case "Hazardous":
        return <AlertTriangle className="h-4 w-4 mr-1" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="bg-blue-700 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Air Quality Categorization</h1>
          <p className="text-lg">Categorize air quality based on various pollutants and standards</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 flex-1">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Air Quality Data</CardTitle>
                  <CardDescription>Enter pollutant concentrations to categorize air quality</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="standard">Air Quality Standard</Label>
                    <Select value={standard} onValueChange={setStandard}>
                      <SelectTrigger id="standard">
                        <SelectValue placeholder="Select standard" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="who">WHO Guidelines</SelectItem>
                        <SelectItem value="us-epa">US EPA AQI</SelectItem>
                        <SelectItem value="eu">European Union Standards</SelectItem>
                        <SelectItem value="custom">Custom Thresholds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pm25">PM2.5 (μg/m³)</Label>
                    <Input id="pm25" type="number" defaultValue="15" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pm10">PM10 (μg/m³)</Label>
                    <Input id="pm10" type="number" defaultValue="30" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="no2">NO₂ (ppb)</Label>
                    <Input id="no2" type="number" defaultValue="25" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="o3">O₃ (ppb)</Label>
                    <Input id="o3" type="number" defaultValue="40" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="co">CO (ppm)</Label>
                    <Input id="co" type="number" defaultValue="1.5" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="so2">SO₂ (ppb)</Label>
                    <Input id="so2" type="number" defaultValue="10" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Categorize Air Quality"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="results">
                <TabsList className="mb-4">
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
                  <TabsTrigger value="health">Health Implications</TabsTrigger>
                </TabsList>

                <TabsContent value="results">
                  <Card>
                    <CardHeader>
                      <CardTitle>Air Quality Categorization Results</CardTitle>
                      <CardDescription>
                        Based on{" "}
                        {standard === "who"
                          ? "WHO Guidelines"
                          : standard === "us-epa"
                            ? "US EPA AQI"
                            : standard === "eu"
                              ? "European Union Standards"
                              : "Custom Thresholds"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!resultsReady ? (
                        <div className="text-center py-12">
                          <p className="text-gray-500">
                            Enter pollutant values and click "Categorize Air Quality" to see results
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="text-center py-6 bg-amber-50 rounded-lg border border-amber-100">
                            <h3 className="text-2xl font-bold text-amber-600 mb-2">Moderate</h3>
                            <p className="text-amber-600">
                              Air quality is acceptable but may cause concern for some sensitive individuals.
                            </p>
                            <div className="mt-4">
                              <Badge variant="warning" className="text-lg py-1 px-3">
                                AQI: 75
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-3">Pollutant Breakdown</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Pollutant</TableHead>
                                  <TableHead>Value</TableHead>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Index</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-medium">PM2.5</TableCell>
                                  <TableCell>15 μg/m³</TableCell>
                                  <TableCell>
                                    <Badge variant="warning" className="flex items-center">
                                      <Info className="h-4 w-4 mr-1" />
                                      Moderate
                                    </Badge>
                                  </TableCell>
                                  <TableCell>75</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">PM10</TableCell>
                                  <TableCell>30 μg/m³</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="flex items-center">
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Good
                                    </Badge>
                                  </TableCell>
                                  <TableCell>45</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">NO₂</TableCell>
                                  <TableCell>25 ppb</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="flex items-center">
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Good
                                    </Badge>
                                  </TableCell>
                                  <TableCell>30</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">O₃</TableCell>
                                  <TableCell>40 ppb</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="flex items-center">
                                      <Info className="h-4 w-4 mr-1" />
                                      Moderate
                                    </Badge>
                                  </TableCell>
                                  <TableCell>60</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button variant="outline" disabled={!resultsReady}>
                        Export Results
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="details">
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Analysis</CardTitle>
                      <CardDescription>Comprehensive breakdown of air quality parameters</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!resultsReady ? (
                        <div className="text-center py-12">
                          <p className="text-gray-500">Analyze air quality first to see detailed results</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-medium mb-3">Comparison to Standards</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Pollutant</TableHead>
                                  <TableHead>Value</TableHead>
                                  <TableHead>WHO Guideline</TableHead>
                                  <TableHead>US EPA Standard</TableHead>
                                  <TableHead>EU Standard</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-medium">PM2.5</TableCell>
                                  <TableCell>15 μg/m³</TableCell>
                                  <TableCell>5 μg/m³</TableCell>
                                  <TableCell>12 μg/m³</TableCell>
                                  <TableCell>25 μg/m³</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">PM10</TableCell>
                                  <TableCell>30 μg/m³</TableCell>
                                  <TableCell>15 μg/m³</TableCell>
                                  <TableCell>50 μg/m³</TableCell>
                                  <TableCell>40 μg/m³</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">NO₂</TableCell>
                                  <TableCell>25 ppb</TableCell>
                                  <TableCell>10 ppb</TableCell>
                                  <TableCell>53 ppb</TableCell>
                                  <TableCell>21 ppb</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">O₃</TableCell>
                                  <TableCell>40 ppb</TableCell>
                                  <TableCell>50 ppb</TableCell>
                                  <TableCell>70 ppb</TableCell>
                                  <TableCell>60 ppb</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>

                          <div>
                            <h4 className="font-medium mb-3">Exceedance Analysis</h4>
                            <div className="space-y-3">
                              <div className="p-3 bg-red-50 rounded-md border border-red-100">
                                <div className="flex items-start">
                                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                                  <div>
                                    <h5 className="font-medium text-red-700">PM2.5 exceeds WHO guideline by 200%</h5>
                                    <p className="text-sm text-red-600 mt-1">
                                      The measured PM2.5 concentration (15 μg/m³) is 3 times higher than the WHO
                                      guideline (5 μg/m³).
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="p-3 bg-red-50 rounded-md border border-red-100">
                                <div className="flex items-start">
                                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                                  <div>
                                    <h5 className="font-medium text-red-700">PM10 exceeds WHO guideline by 100%</h5>
                                    <p className="text-sm text-red-600 mt-1">
                                      The measured PM10 concentration (30 μg/m³) is 2 times higher than the WHO
                                      guideline (15 μg/m³).
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="p-3 bg-red-50 rounded-md border border-red-100">
                                <div className="flex items-start">
                                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                                  <div>
                                    <h5 className="font-medium text-red-700">NO₂ exceeds WHO guideline by 150%</h5>
                                    <p className="text-sm text-red-600 mt-1">
                                      The measured NO₂ concentration (25 ppb) is 2.5 times higher than the WHO guideline
                                      (10 ppb).
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="health">
                  <Card>
                    <CardHeader>
                      <CardTitle>Health Implications</CardTitle>
                      <CardDescription>Potential health effects based on current air quality</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!resultsReady ? (
                        <div className="text-center py-12">
                          <p className="text-gray-500">Analyze air quality first to see health implications</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                            <h4 className="text-lg font-medium text-amber-700 mb-2">Health Advisory</h4>
                            <p className="text-amber-700 mb-4">
                              Air quality is acceptable; however, there may be a moderate health concern for a very
                              small number of people who are unusually sensitive to air pollution.
                            </p>

                            <h5 className="font-medium text-amber-700 mb-2">Sensitive Groups:</h5>
                            <ul className="list-disc pl-5 space-y-1 text-amber-700">
                              <li>People with respiratory diseases such as asthma</li>
                              <li>Children and older adults</li>
                              <li>People who are active outdoors</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-medium mb-3">Pollutant-Specific Health Effects</h4>
                            <div className="space-y-4">
                              <div className="p-3 bg-gray-50 rounded-md border">
                                <h5 className="font-medium mb-1">PM2.5 (15 μg/m³)</h5>
                                <p className="text-sm text-gray-600">
                                  Fine particulate matter can penetrate deep into the lungs and bloodstream. At this
                                  level, sensitive individuals may experience respiratory symptoms.
                                </p>
                              </div>

                              <div className="p-3 bg-gray-50 rounded-md border">
                                <h5 className="font-medium mb-1">PM10 (30 μg/m³)</h5>
                                <p className="text-sm text-gray-600">
                                  Inhalable particles can cause respiratory irritation. Current levels are unlikely to
                                  cause significant health effects in most people.
                                </p>
                              </div>

                              <div className="p-3 bg-gray-50 rounded-md border">
                                <h5 className="font-medium mb-1">NO₂ (25 ppb)</h5>
                                <p className="text-sm text-gray-600">
                                  Nitrogen dioxide can irritate airways and increase susceptibility to respiratory
                                  infections. At this level, some sensitive individuals may notice mild effects.
                                </p>
                              </div>

                              <div className="p-3 bg-gray-50 rounded-md border">
                                <h5 className="font-medium mb-1">O₃ (40 ppb)</h5>
                                <p className="text-sm text-gray-600">
                                  Ground-level ozone can trigger respiratory problems. Current levels may cause mild
                                  respiratory symptoms in sensitive individuals during prolonged outdoor activities.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-3">Recommendations</h4>
                            <div className="space-y-2">
                              <div className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                                <p>
                                  Unusually sensitive people should consider reducing prolonged or heavy exertion
                                  outdoors.
                                </p>
                              </div>
                              <div className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                                <p>People with respiratory conditions should keep quick-relief medicine handy.</p>
                              </div>
                              <div className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                                <p>Everyone else can continue normal activities.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      {/* Standards Information */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Air Quality Standards</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>WHO Guidelines</CardTitle>
                <CardDescription>World Health Organization Air Quality Guidelines</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  The WHO guidelines are designed to protect public health worldwide and are often stricter than
                  national standards.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>PM2.5 (annual):</span>
                    <span className="font-medium">5 μg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PM10 (annual):</span>
                    <span className="font-medium">15 μg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NO₂ (annual):</span>
                    <span className="font-medium">10 ppb</span>
                  </div>
                  <div className="flex justify-between">
                    <span>O₃ (8-hour):</span>
                    <span className="font-medium">50 ppb</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>US EPA Standards</CardTitle>
                <CardDescription>United States Environmental Protection Agency Standards</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  The US EPA standards are used to calculate the Air Quality Index (AQI) and inform the public about air
                  quality in the United States.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>PM2.5 (annual):</span>
                    <span className="font-medium">12 μg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PM10 (24-hour):</span>
                    <span className="font-medium">150 μg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NO₂ (annual):</span>
                    <span className="font-medium">53 ppb</span>
                  </div>
                  <div className="flex justify-between">
                    <span>O₃ (8-hour):</span>
                    <span className="font-medium">70 ppb</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>EU Standards</CardTitle>
                <CardDescription>European Union Air Quality Standards</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  The EU standards are legally binding limits set to protect human health and the environment across
                  European Union member states.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>PM2.5 (annual):</span>
                    <span className="font-medium">25 μg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PM10 (annual):</span>
                    <span className="font-medium">40 μg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NO₂ (annual):</span>
                    <span className="font-medium">21 ppb</span>
                  </div>
                  <div className="flex justify-between">
                    <span>O₃ (8-hour):</span>
                    <span className="font-medium">60 ppb</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

