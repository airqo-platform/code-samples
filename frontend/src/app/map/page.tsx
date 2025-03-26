"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Info, AlertCircle } from "lucide-react"

export default function MapPage() {
  const [mapType, setMapType] = useState("standard")
  const [showLegend, setShowLegend] = useState(true)
  const [pollutantType, setPollutantType] = useState("pm25")
  const [timeRange, setTimeRange] = useState("24h")

  return (
    <div className="flex flex-col min-h-screen">
      {/* Map Header */}
      <section className="bg-blue-700 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Air Quality Map</h1>
          <p className="text-lg">Visualize real-time air quality data across different regions</p>
        </div>
      </section>

      {/* Map Container */}
      <section className="flex-1 flex flex-col lg:flex-row">
        {/* Map Controls Sidebar */}
        <div className="w-full lg:w-80 bg-gray-50 p-4 border-r border-b lg:border-b-0">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Map Controls</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="map-type">Map Type</Label>
                  <Select value={mapType} onValueChange={setMapType}>
                    <SelectTrigger id="map-type">
                      <SelectValue placeholder="Select map type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="satellite">Satellite</SelectItem>
                      <SelectItem value="terrain">Terrain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pollutant-type">Pollutant</Label>
                  <Select value={pollutantType} onValueChange={setPollutantType}>
                    <SelectTrigger id="pollutant-type">
                      <SelectValue placeholder="Select pollutant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pm25">PM2.5</SelectItem>
                      <SelectItem value="pm10">PM10</SelectItem>
                      <SelectItem value="no2">NO₂</SelectItem>
                      <SelectItem value="o3">O₃</SelectItem>
                      <SelectItem value="co">CO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-range">Time Range</Label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger id="time-range">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="show-legend" checked={showLegend} onCheckedChange={setShowLegend} />
                  <Label htmlFor="show-legend">Show Legend</Label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Layers</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="layer-monitors" defaultChecked />
                  <Label htmlFor="layer-monitors">Air Quality Monitors</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="layer-heatmap" defaultChecked />
                  <Label htmlFor="layer-heatmap">Pollution Heatmap</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="layer-wind" />
                  <Label htmlFor="layer-wind">Wind Direction</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="layer-traffic" />
                  <Label htmlFor="layer-traffic">Traffic Density</Label>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-700">About This Map</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    This map displays real-time air quality data from our network of sensors. The colors represent the
                    Air Quality Index (AQI) levels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Map Area */}
        <div className="flex-1 bg-gray-200 flex flex-col">
          {/* Map Placeholder - In a real implementation, this would be replaced with a map component */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">Map Visualization</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                In a real implementation, this area would display an interactive map with air quality data.
              </p>
            </div>
          </div>

          {/* Map Legend */}
          {showLegend && (
            <div className="bg-white p-4 border-t">
              <h4 className="font-medium mb-2">Air Quality Index (AQI) Legend</h4>
              <div className="flex space-x-2">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-4 bg-green-500 rounded"></div>
                  <span className="text-xs mt-1">Good</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-xs mt-1">Moderate</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-4 bg-orange-500 rounded"></div>
                  <span className="text-xs mt-1">Unhealthy for Sensitive Groups</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-4 bg-red-500 rounded"></div>
                  <span className="text-xs mt-1">Unhealthy</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-4 bg-purple-500 rounded"></div>
                  <span className="text-xs mt-1">Very Unhealthy</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-4 bg-rose-900 rounded"></div>
                  <span className="text-xs mt-1">Hazardous</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Data Insights */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Data Insights</h2>

          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Average AQI</CardTitle>
                    <CardDescription>Across all monitoring stations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-500">86</div>
                    <p className="text-sm text-gray-500">Moderate</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Highest AQI</CardTitle>
                    <CardDescription>Central Business District</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-500">152</div>
                    <p className="text-sm text-gray-500">Unhealthy</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Lowest AQI</CardTitle>
                    <CardDescription>Suburban Park Area</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-500">42</div>
                    <p className="text-sm text-gray-500">Good</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Air Quality Trends</CardTitle>
                  <CardDescription>PM2.5 levels over the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-100 rounded-md">
                    <p className="text-gray-500">Trend chart would appear here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hotspots">
              <Card>
                <CardHeader>
                  <CardTitle>Pollution Hotspots</CardTitle>
                  <CardDescription>Areas with consistently high pollution levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-md border border-red-100">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                          <h4 className="font-medium">Central Business District</h4>
                          <p className="text-sm text-gray-600">High traffic area with elevated PM2.5 and NO₂</p>
                        </div>
                      </div>
                      <div className="text-red-500 font-bold">152 AQI</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-md border border-orange-100">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                        <div>
                          <h4 className="font-medium">Industrial Zone</h4>
                          <p className="text-sm text-gray-600">Manufacturing area with elevated particulate matter</p>
                        </div>
                      </div>
                      <div className="text-orange-500 font-bold">126 AQI</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-md border border-amber-100">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                        <div>
                          <h4 className="font-medium">Highway Corridor</h4>
                          <p className="text-sm text-gray-600">High traffic volume with elevated NO₂ levels</p>
                        </div>
                      </div>
                      <div className="text-amber-500 font-bold">95 AQI</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}

