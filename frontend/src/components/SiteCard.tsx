"use client"

import { Card, CardContent } from "@/ui/card"
import { Button } from "@/ui/button"
import { BarChart2 } from "lucide-react"
import Link from "next/link"
import type { SiteData } from "@/lib/types"

interface SiteCardProps {
  site: SiteData
  onSelect?: () => void
  isSelected?: boolean
  isCheckboxSelected?: boolean
  onCheckboxChange?: () => void
  lastSelectedId?: string | null
  showHistoricalLink?: boolean
}

export function SiteCard({
  site,
  onSelect,
  isSelected,
  isCheckboxSelected,
  onCheckboxChange,
  lastSelectedId,
  showHistoricalLink = true,
}: SiteCardProps) {
  const pm25Value = site.pm2_5?.value ?? 0
  const aqiCategory = site.aqi_category || "Unknown"
  const siteName = site.siteDetails?.name || site.siteDetails?.formatted_name || "Unknown Site"
  const areaName = site.siteDetails?.site_category?.area_name || "Unknown Area"
  const percentChange = site.averages?.percentageDifference ?? 0
  const country = site.siteDetails?.country || "Unknown"
  const city = site.siteDetails?.city || "Unknown"

  // Get color based on AQI category
  const getColorByCategory = (category: string): string => {
    switch (category.toLowerCase()) {
      case "good":
        return "bg-green-100 border-green-300 text-green-800"
      case "moderate":
        return "bg-yellow-100 border-yellow-300 text-yellow-800"
      case "unhealthy for sensitive groups":
        return "bg-orange-100 border-orange-300 text-orange-800"
      case "unhealthy":
        return "bg-red-100 border-red-300 text-red-800"
      case "very unhealthy":
        return "bg-purple-100 border-purple-300 text-purple-800"
      case "hazardous":
        return "bg-red-200 border-red-400 text-red-900"
      default:
        return "bg-gray-100 border-gray-300 text-gray-800"
    }
  }

  return (
    <Card
      className={`w-full shadow-md hover:shadow-lg transition-all duration-300 ${getColorByCategory(aqiCategory)} ${
        isSelected ? "ring-2 ring-blue-500" : ""
      } ${isCheckboxSelected ? "relative overflow-hidden" : ""} ${isCheckboxSelected ? "animate-pulse-subtle" : ""} ${
        site._id === lastSelectedId ? "scale-105 shadow-xl z-10" : ""
      }`}
    >
      {isCheckboxSelected && (
        <div className="absolute -top-1 -right-1 transform rotate-45 bg-blue-500 text-white px-8 py-1 shadow-md">
          Selected
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold mb-1">{siteName}</h3>
            <p className="text-sm mb-1">{areaName}</p>
            <p className="text-xs text-gray-600 mb-3">
              {city}, {country}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-medium">Current PM2.5</span>
            <div className="text-2xl font-bold">{pm25Value.toFixed(1)} µg/m³</div>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium">AQI Category</span>
            <div className="text-lg font-semibold">{aqiCategory}</div>
          </div>
        </div>

        <div className="flex flex-col space-y-2 mt-4">
          {onSelect && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                if (onSelect) onSelect()
              }}
              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              {isSelected ? "Selected for Report" : "Select for Detailed Report"}
            </Button>
          )}

          {showHistoricalLink && (
            <Link
              href={`/historical?siteId=${site.site_id}&siteName=${encodeURIComponent(siteName)}`}
              className="w-full"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <BarChart2 className="h-4 w-4" />
                <span>View Historical Data</span>
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

