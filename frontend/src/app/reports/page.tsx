"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Input } from "@/components/ui/input"
import { BarChart, LineChart, PieChart, MapPin } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, Download, FileText, Share2 } from "lucide-react"

export default function ReportsPage() {
  const [date, setDate] = useState<string>("")
  const [reportType, setReportType] = useState("daily")
  const [location, setLocation] = useState("all")

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <section className="bg-blue-700 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Air Quality Reports</h1>
          <p className="text-lg">Generate detailed reports on air quality trends and patterns</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 flex-1">
        <div className="container mx-auto px-4">
          {/* Report Controls */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Customize your air quality report parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Report</SelectItem>
                      <SelectItem value="weekly">Weekly Report</SelectItem>
                      <SelectItem value="monthly">Monthly Report</SelectItem>
                      <SelectItem value="quarterly">Quarterly Report</SelectItem>
                      <SelectItem value="annual">Annual Report</SelectItem>
                      <SelectItem value="custom">Custom Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="downtown">Downtown</SelectItem>
                      <SelectItem value="residential">Residential Areas</SelectItem>
                      <SelectItem value="industrial">Industrial Zone</SelectItem>
                      <SelectItem value="suburban">Suburban Areas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  {reportType === "custom" ? (
                    <DatePickerWithRange className="w-full" />
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? date : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4">
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button>Generate Report</Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Content */}
          <Tabs defaultValue="summary">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="pollutants">Pollutants</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
              </TabsList>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <TabsContent value="summary">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Air Quality Summary</CardTitle>
                    <CardDescription>Overview of air quality for the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="text-sm text-gray-500">Average AQI</div>
                          <div className="text-3xl font-bold text-amber-500">76</div>
                          <div className="text-sm font-medium">Moderate</div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="text-sm text-gray-500">Max AQI</div>
                          <div className="text-3xl font-bold text-red-500">142</div>
                          <div className="text-sm font-medium">Unhealthy</div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="text-sm text-gray-500">Good Air Days</div>
                          <div className="text-3xl font-bold text-green-500">12</div>
                          <div className="text-sm font-medium">40% of period</div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="text-sm text-gray-500">Unhealthy Days</div>
                          <div className="text-3xl font-bold text-red-500">5</div>
                          <div className="text-sm font-medium">17% of period</div>
                        </div>
                      </div>

                      <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <PieChart className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Air Quality Distribution Chart</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                    <CardDescription>Important findings from the data analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                        <h4 className="font-medium text-blue-700 mb-1">PM2.5 Levels Trending Down</h4>
                        <p className="text-sm text-blue-600">
                          PM2.5 concentrations have decreased by 15% compared to the previous period, indicating
                          improved air quality.
                        </p>
                      </div>

                      <div className="p-3 bg-amber-50 rounded-md border border-amber-100">
                        <h4 className="font-medium text-amber-700 mb-1">Ozone Levels Elevated</h4>
                        <p className="text-sm text-amber-600">
                          Ozone levels were higher than normal during afternoon hours, particularly on sunny days with
                          high temperatures.
                        </p>
                      </div>

                      <div className="p-3 bg-green-50 rounded-md border border-green-100">
                        <h4 className="font-medium text-green-700 mb-1">Weekend Air Quality Improvement</h4>
                        <p className="text-sm text-green-600">
                          Air quality consistently improved on weekends, with AQI values 20-30% lower than weekdays due
                          to reduced traffic.
                        </p>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-md border border-purple-100">
                        <h4 className="font-medium text-purple-700 mb-1">Spatial Variation</h4>
                        <p className="text-sm text-purple-600">
                          Significant spatial variation observed, with industrial areas showing 2-3x higher pollutant
                          concentrations than residential areas.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Daily AQI Trend</CardTitle>
                    <CardDescription>Air Quality Index variation over the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <LineChart className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Daily AQI Trend Chart</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Long-term Air Quality Trends</CardTitle>
                    <CardDescription>Historical air quality data analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <LineChart className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Long-term Trend Chart</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Seasonal Patterns</CardTitle>
                      <CardDescription>Air quality variation by season</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <BarChart className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Seasonal Comparison Chart</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Diurnal Patterns</CardTitle>
                      <CardDescription>Air quality variation by time of day</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <LineChart className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Diurnal Pattern Chart</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pollutants">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>PM2.5 Analysis</CardTitle>
                    <CardDescription>Fine particulate matter concentration trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <LineChart className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">PM2.5 Trend Chart</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>NO₂ Analysis</CardTitle>
                    <CardDescription>Nitrogen dioxide concentration trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <LineChart className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">NO₂ Trend Chart</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>O₃ Analysis</CardTitle>
                    <CardDescription>Ozone concentration trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <LineChart className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">O₃ Trend Chart</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pollutant Comparison</CardTitle>
                    <CardDescription>Relative contribution of different pollutants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <PieChart className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Pollutant Comparison Chart</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="locations">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Spatial Distribution</CardTitle>
                    <CardDescription>Air quality variation across different locations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Spatial Distribution Map</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Downtown</CardTitle>
                      <CardDescription>Central business district</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Average AQI</span>
                          <span className="text-lg font-bold text-amber-500">92</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Max AQI</span>
                          <span className="text-lg font-bold text-red-500">142</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Primary Pollutant</span>
                          <span className="text-lg font-bold">NO₂</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Residential Areas</CardTitle>
                      <CardDescription>Residential neighborhoods</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Average AQI</span>
                          <span className="text-lg font-bold text-yellow-500">65</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Max AQI</span>
                          <span className="text-lg font-bold text-amber-500">95</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Primary Pollutant</span>
                          <span className="text-lg font-bold">PM2.5</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Industrial Zone</CardTitle>
                      <CardDescription>Manufacturing and industrial areas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Average AQI</span>
                          <span className="text-lg font-bold text-red-500">115</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Max AQI</span>
                          <span className="text-lg font-bold text-red-500">165</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Primary Pollutant</span>
                          <span className="text-lg font-bold">PM10</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}

