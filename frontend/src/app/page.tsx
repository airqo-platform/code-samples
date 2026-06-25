"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  Locate,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Pause,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  Wind,
  X,
} from "lucide-react"
import Navigation from "@/components/navigation/navigation"
import {
  getDailyForecastCollection,
  getMapNodes,
  type DailyForecastEntry,
  type DailyForecastResponse,
  type MapNode,
} from "@/services/apiService"
import {
  isBrowserApiCacheFresh,
  readBrowserApiCache,
  writeBrowserApiCache,
  type BrowserApiCacheEntry,
} from "@/lib/browserApiCache"

type ForecastTickerItem = {
  id: string
  siteName: string
  country: string
  forecast: DailyForecastEntry
}

type LocationState = "idle" | "requesting" | "ready" | "denied" | "unavailable"

const FORECAST_TICKER_COUNTRY_KEY = "daily-forecast-country"
const FORECAST_TICKER_LOCATION_STATE_KEY = "daily-forecast-location-state"
const FORECAST_TICKER_ACTIVE_KEY = "daily-forecast-active"
const FORECAST_TICKER_VISIBLE_KEY = "daily-forecast-visible"
const FORECAST_TICKER_COORDINATES_KEY = "daily-forecast-coordinates"
const DAILY_FORECAST_CACHE_KEY = "map-daily-forecast"
const DAILY_FORECAST_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000

type MapboxCountryResponse = {
  features?: Array<{
    properties?: {
      name?: string
      context?: {
        country?: {
          name?: string
        }
      }
    }
  }>
}

const capabilityCards = [
  {
    title: "Explore live air quality",
    description: "See monitoring sites, pollution levels, heatmaps, and forecasts in one interactive view.",
    href: "/map",
    image: "/images/homemap.webp",
    icon: MapIcon,
    accent: "bg-blue-600",
  },
  {
    title: "Plan monitoring networks",
    description: "Use spatial intelligence to identify high-value locations for new air quality sensors.",
    href: "/locate",
    image: "/images/model/locate.webp",
    icon: LocateFixed,
    accent: "bg-emerald-600",
  },
  {
    title: "Understand pollution sources",
    description: "Combine land use, satellite evidence, and nearby source context for clearer decisions.",
    href: "/categorize",
    image: "/images/model/categorisemap.webp",
    icon: BrainCircuit,
    accent: "bg-violet-600",
  },
]

const workflowSteps = [
  {
    icon: Radio,
    label: "Observe",
    title: "Measurements arrive",
    description: "AirQo monitoring networks provide a continuous view of changing air quality.",
  },
  {
    icon: BrainCircuit,
    label: "Understand",
    title: "AI finds the signal",
    description: "Models clean, enrich, forecast, and explain patterns hidden in environmental data.",
  },
  {
    icon: ShieldCheck,
    label: "Act",
    title: "Teams make decisions",
    description: "Clear maps, reports, and recommendations turn complex evidence into practical action.",
  },
]

function normalizeColor(color?: string) {
  if (!color) return "#2563eb"
  return color.startsWith("#") ? color : `#${color}`
}

function getAqiImageByCategory(category?: string) {
  switch ((category || "").toLowerCase()) {
    case "good":
      return "/images/GoodAir.png"
    case "moderate":
      return "/images/Moderate.png"
    case "unhealthy for sensitive groups":
      return "/images/UnhealthySG.png"
    case "unhealthy":
      return "/images/Unhealthy.png"
    case "very unhealthy":
      return "/images/VeryUnhealthy.png"
    case "hazardous":
      return "/images/Hazardous.png"
    default:
      return "/images/Invalid.png"
  }
}

function formatForecastDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Daily outlook"
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
}

function getDistanceInKm(latitude: number, longitude: number, node: MapNode) {
  const siteLatitude = node.siteDetails?.approximate_latitude
  const siteLongitude = node.siteDetails?.approximate_longitude
  if (typeof siteLatitude !== "number" || typeof siteLongitude !== "number") return Number.POSITIVE_INFINITY

  const earthRadiusKm = 6371
  const latitudeDelta = ((siteLatitude - latitude) * Math.PI) / 180
  const longitudeDelta = ((siteLongitude - longitude) * Math.PI) / 180
  const originLatitude = (latitude * Math.PI) / 180
  const siteLatitudeRadians = (siteLatitude * Math.PI) / 180
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(siteLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function getCoordinatesForCountry(country: string, mapNodes: MapNode[]) {
  const matchingNodes = mapNodes.filter(
    (node) =>
      node.siteDetails?.country?.trim().toLowerCase() === country.trim().toLowerCase() &&
      typeof node.siteDetails.approximate_latitude === "number" &&
      typeof node.siteDetails.approximate_longitude === "number",
  )
  if (!matchingNodes.length) return null

  return {
    latitude:
      matchingNodes.reduce((sum, node) => sum + node.siteDetails.approximate_latitude!, 0) /
      matchingNodes.length,
    longitude:
      matchingNodes.reduce((sum, node) => sum + node.siteDetails.approximate_longitude!, 0) /
      matchingNodes.length,
  }
}

async function resolveCountry(latitude: number, longitude: number, mapNodes: MapNode[]) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (mapboxToken) {
    const url = new URL("https://api.mapbox.com/search/geocode/v6/reverse")
    url.searchParams.set("longitude", String(longitude))
    url.searchParams.set("latitude", String(latitude))
    url.searchParams.set("types", "country")
    url.searchParams.set("limit", "1")
    url.searchParams.set("access_token", mapboxToken)

    try {
      const response = await fetch(url, { cache: "no-store" })
      if (response.ok) {
        const data = (await response.json()) as MapboxCountryResponse
        const country =
          data.features?.[0]?.properties?.name ||
          data.features?.[0]?.properties?.context?.country?.name
        if (country) return country
      }
    } catch (error) {
      console.error("Unable to reverse geocode visitor country:", error)
    }
  }

  return mapNodes
    .filter((node) => Boolean(node.siteDetails?.country))
    .reduce<{ node: MapNode; distance: number } | null>((nearest, node) => {
      const distance = getDistanceInKm(latitude, longitude, node)
      return !nearest || distance < nearest.distance ? { node, distance } : nearest
    }, null)
    ?.node.siteDetails?.country?.trim()
}

function DailyForecastTicker() {
  const [collection, setCollection] = useState<DailyForecastResponse | null>(null)
  const [mapNodes, setMapNodes] = useState<MapNode[]>([])
  const [loading, setLoading] = useState(true)
  const [locationState, setLocationState] = useState<LocationState>("idle")
  const [visitorCountry, setVisitorCountry] = useState("")
  const [visitorCoordinates, setVisitorCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isTickerActive, setIsTickerActive] = useState(true)
  const [isTickerVisible, setIsTickerVisible] = useState(true)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)

  useEffect(() => {
    const savedCountry = window.localStorage.getItem(FORECAST_TICKER_COUNTRY_KEY)?.trim() || ""
    const savedLocationState = window.localStorage.getItem(FORECAST_TICKER_LOCATION_STATE_KEY)
    const savedActive = window.localStorage.getItem(FORECAST_TICKER_ACTIVE_KEY)
    const savedVisible = window.localStorage.getItem(FORECAST_TICKER_VISIBLE_KEY)
    const savedCoordinates = window.localStorage.getItem(FORECAST_TICKER_COORDINATES_KEY)

    if (savedCountry) {
      setVisitorCountry(savedCountry)
      setLocationState("ready")
    } else if (savedLocationState === "denied" || savedLocationState === "unavailable") {
      setLocationState(savedLocationState)
    }

    if (savedActive !== null) setIsTickerActive(savedActive === "true")
    if (savedVisible !== null) setIsTickerVisible(savedVisible === "true")
    if (savedCoordinates) {
      try {
        const coordinates = JSON.parse(savedCoordinates) as { latitude?: number; longitude?: number }
        if (typeof coordinates.latitude === "number" && typeof coordinates.longitude === "number") {
          setVisitorCoordinates({ latitude: coordinates.latitude, longitude: coordinates.longitude })
        }
      } catch {
        window.localStorage.removeItem(FORECAST_TICKER_COORDINATES_KEY)
      }
    }
    setPreferencesLoaded(true)
  }, [])

  useEffect(() => {
    if (!preferencesLoaded) return
    window.localStorage.setItem(FORECAST_TICKER_ACTIVE_KEY, String(isTickerActive))
  }, [isTickerActive, preferencesLoaded])

  useEffect(() => {
    if (!preferencesLoaded) return
    window.localStorage.setItem(FORECAST_TICKER_VISIBLE_KEY, String(isTickerVisible))
  }, [isTickerVisible, preferencesLoaded])

  useEffect(() => {
    let active = true

    const loadDailyForecast = async () => {
      const cached = await readBrowserApiCache<BrowserApiCacheEntry<DailyForecastResponse>>(DAILY_FORECAST_CACHE_KEY)
      if (
        isBrowserApiCacheFresh(cached, DAILY_FORECAST_CACHE_MAX_AGE_MS) &&
        cached.data.forecasts?.length
      ) {
        return cached.data
      }

      const forecastData = await getDailyForecastCollection()
      if (forecastData?.forecasts?.length) {
        writeBrowserApiCache(DAILY_FORECAST_CACHE_KEY, forecastData).catch((error) => {
          console.warn("Unable to cache daily forecast ticker data:", error)
        })
      }
      return forecastData
    }

    Promise.all([loadDailyForecast(), getMapNodes()])
      .then(([forecastData, nodes]) => {
        if (!active) return
        setCollection(forecastData)
        setMapNodes(nodes || [])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationState("unavailable")
      window.localStorage.removeItem(FORECAST_TICKER_COUNTRY_KEY)
      window.localStorage.removeItem(FORECAST_TICKER_COORDINATES_KEY)
      window.localStorage.setItem(FORECAST_TICKER_LOCATION_STATE_KEY, "unavailable")
      return
    }

    setLocationState("requesting")
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const country = await resolveCountry(coords.latitude, coords.longitude, mapNodes)
        if (country) {
          const coordinates = { latitude: coords.latitude, longitude: coords.longitude }
          setVisitorCountry(country)
          setVisitorCoordinates(coordinates)
          setLocationState("ready")
          window.localStorage.setItem(FORECAST_TICKER_COUNTRY_KEY, country)
          window.localStorage.setItem(FORECAST_TICKER_COORDINATES_KEY, JSON.stringify(coordinates))
          window.localStorage.setItem(FORECAST_TICKER_LOCATION_STATE_KEY, "ready")
        } else {
          setLocationState("unavailable")
          window.localStorage.removeItem(FORECAST_TICKER_COUNTRY_KEY)
          window.localStorage.removeItem(FORECAST_TICKER_COORDINATES_KEY)
          window.localStorage.setItem(FORECAST_TICKER_LOCATION_STATE_KEY, "unavailable")
        }
      },
      () => {
        setLocationState("denied")
        window.localStorage.removeItem(FORECAST_TICKER_COUNTRY_KEY)
        window.localStorage.removeItem(FORECAST_TICKER_COORDINATES_KEY)
        window.localStorage.setItem(FORECAST_TICKER_LOCATION_STATE_KEY, "denied")
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30 * 60 * 1000 },
    )
  }

  const tickerItems = useMemo<ForecastTickerItem[]>(() => {
    if (!collection?.forecasts?.length || !visitorCountry) return []

    const nodeBySiteId = new Map(
      mapNodes
        .filter((node) => node.site_id)
        .map((node) => [node.site_id, node]),
    )
    const visitorCountryKey = visitorCountry.trim().toLowerCase()
    const sitesInVisitorCountry = collection.forecasts.filter(
      (site) =>
        nodeBySiteId.get(site.site_details.site_id)?.siteDetails?.country?.trim().toLowerCase() ===
        visitorCountryKey,
    )

    let selectedSites = sitesInVisitorCountry
    let selectedCountry = visitorCountry

    if (!selectedSites.length) {
      const origin = visitorCoordinates || getCoordinatesForCountry(visitorCountry, mapNodes)
      const nearestForecastNode = origin
        ? collection.forecasts.reduce<{ node: MapNode; distance: number } | null>((nearest, site) => {
            const node = nodeBySiteId.get(site.site_details.site_id)
            if (!node?.siteDetails?.country) return nearest
            const distance = getDistanceInKm(origin.latitude, origin.longitude, node)
            if (!Number.isFinite(distance)) return nearest
            return !nearest || distance < nearest.distance ? { node, distance } : nearest
          }, null)
        : null
      const nearestCountry = nearestForecastNode?.node.siteDetails.country?.trim()

      if (nearestCountry) {
        selectedCountry = nearestCountry
        selectedSites = collection.forecasts.filter(
          (site) =>
            nodeBySiteId.get(site.site_details.site_id)?.siteDetails?.country?.trim().toLowerCase() ===
            nearestCountry.toLowerCase(),
        )
      }
    }

    return selectedSites
      .map((site) => {
        const forecast = site.forecasts?.[0]
        if (!forecast) return null
        return {
          id: `${site.site_details.site_id}-${forecast.date}`,
          siteName: site.site_details.site_name || "AirQo site",
          country: selectedCountry,
          forecast,
        }
      })
      .filter((item): item is ForecastTickerItem => Boolean(item))
      .slice(0, 24)
  }, [collection, mapNodes, visitorCoordinates, visitorCountry])

  const renderedItems = tickerItems.length > 0 ? [...tickerItems, ...tickerItems] : []

  if (!isTickerVisible) {
    return (
      <div className="flex justify-end border-b border-blue-100 bg-blue-50 px-4 py-2">
        <button
          type="button"
          onClick={() => setIsTickerVisible(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 transition hover:bg-blue-100"
        >
          <Play className="h-3.5 w-3.5" />
          Show daily forecast
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <Navigation />
      <DailyForecastTicker />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center bg-blue-50 p-8 dark:bg-slate-900">
        <div className="absolute inset-0 bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-slate-950 dark:text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                AI-Powered Air Quality Monitoring
              </h1>
              <p className="text-lg text-slate-700 dark:text-slate-300 md:text-xl">
                AirQo AI provides advanced tools for monitoring, analyzing, and optimizing air quality across African
                cities using artificial intelligence.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/map"
                  className="flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-white px-6 py-3 font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
                >
                  Explore the live map <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/reports"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-800 transition hover:bg-blue-100"
                >
                  View air quality reports
                </Link>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 border-t border-blue-200 pt-6 sm:grid-cols-3">
                <div>
                  <p className="text-2xl font-bold text-slate-950">Live</p>
                  <p className="mt-1 text-xs text-slate-500">Monitoring context</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-950">Daily</p>
                  <p className="mt-1 text-xs text-slate-500">Forecast outlooks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-950">AI</p>
                  <p className="mt-1 text-xs text-slate-500">Decision support</p>
                </div>
              </div>
            </div>

            <Link
              href="/map"
              className="group relative block overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-2 shadow-2xl shadow-blue-200/70"
              aria-label="Open the AirQo air quality map"
            >
              <div className="relative min-h-[300px] overflow-hidden rounded-[1.55rem] sm:min-h-[500px]">
                <Image
                  src="/images/homemap.webp"
                  alt="AirQo air quality monitoring map"
                  fill
                  priority
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-blue-950/20" />
                <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-lg backdrop-blur">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Live network view
                  </span>
                  <span className="rounded-full bg-slate-950/70 p-2.5 text-white backdrop-blur">
                    <MapPin className="h-4 w-4" />
                  </span>
                </div>
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-blue-200">Across African communities</p>
                    <p className="mt-1 text-xl font-bold text-white">See what the air is saying now.</p>
                  </div>
                  <span className="hidden rounded-full bg-white p-3 text-blue-700 transition group-hover:translate-x-1 sm:inline-flex">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="bg-white py-16 dark:bg-slate-950 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powered by Artificial Intelligence</h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-slate-300">
              Our platform leverages cutting-edge AI to provide accurate, real-time air quality data and insights for
              researchers, policymakers, and citizens.
            </p>
          </div>
        </section>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              imageSrc="/images/model/locate.webp"
              Icon={MapPin}
              title="Optimal Site Location"
              description="Use AI algorithms to determine the best locations for air quality monitors based on population density, pollution sources, and geographic factors."
              href="/locate/optimal-site-location"
            />
            <FeatureCard
              Icon={Wind}
              title="Air Quality Categorization"
              description="Automatically categorize monitoring sites based on surrounding land use, traffic patterns, and environmental factors."
              href="/categorize/site-categorization"
              imageSrc="/images/model/categorisemap.webp"
            />
            <FeatureCard
              Icon={BarChart3}
              title="Data Analytics"
              description="Generate comprehensive reports with trends, forecasts, and actionable insights from air quality data."
              href="/analytics/data-analytics"
              imageSrc="/images/model/analyticsHome.webp"
            />
            <FeatureCard
              Icon={BrainCircuit}
              title="Machine Learning Models"
              description="Continuously improving prediction models that account for seasonal variations, weather patterns, and human activities."
              href="/models"
              imageSrc="/images/model/modelapi.webp"
            />
            <FeatureCard
              Icon={Shield}
              title="Health Impact Assessment"
              description="Evaluate potential health impacts of air pollution on different population groups and geographic areas."
              href="/comingsoon/health-impact"
              imageSrc="/images/model/calibration-header.webp"
            />
            <FeatureCard
              Icon={MapPin}
              title="Interactive Mapping"
              description="Visualize air quality data across regions with interactive maps showing real-time pollution levels."
              href="/map/interactive-mapping"
              imageSrc="/images/homemap.webp"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section - Redesigned */}
      <section className="bg-gradient-to-b from-gray-50 to-blue-50 py-8 dark:from-slate-900 dark:to-slate-950 md:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How AirQo AI Works</h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-slate-300">
              Our platform combines low-cost sensors, advanced algorithms, and user-friendly interfaces to democratize
              air quality monitoring.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
              <div>
                <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <Wind className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Built for the full decision journey.</h2>
                <p className="mt-4 leading-7 text-slate-600">
                  Air quality work is more than a number on a map. AirQo AI connects measurements, models, and local context
                  so teams can understand what is happening and decide what to do next.
                </p>
                <Link href="/about" className="mt-6 inline-flex items-center gap-2 font-semibold text-blue-700">
                  Learn about AirQo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <div key={step.title} className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <span className="absolute right-5 top-5 text-xs font-bold text-slate-300">0{index + 1}</span>
                      <div className="inline-flex rounded-2xl bg-slate-950 p-3 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{step.label}</p>
                      <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-50 py-8 text-slate-950 dark:bg-slate-900 dark:text-white md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Improve Air Quality?</h2>
          <p className="mx-auto mb-8 max-w-3xl text-xl text-slate-700 dark:text-slate-300">
            Start using our AI-powered tools to make data-driven decisions for cleaner air.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/map"
              className="rounded-lg border border-blue-100 bg-white px-8 py-4 font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
            >
              Explore the Map
            </Link>
            <Link
              href="/reports"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-blue-800 transition hover:bg-blue-50"
            >
              Explore reports <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mb-12 rounded-lg bg-blue-50 p-8 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <div className="mt-8 border-t border-gray-300 pt-8 text-center text-sm dark:border-slate-700">
          &copy; {new Date().getFullYear()} AirQo. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

// Process Card Component - Redesigned
const ProcessCard = ({
  icon,
  number,
  title,
  description,
  imageSrc,
}: {
  icon: React.ReactNode
  number: string
  title: string
  description: string
  imageSrc?: string
}) => {
  return (
    <div className="relative h-full transform overflow-hidden rounded-xl border border-blue-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900">
      {imageSrc && (
        <div className="absolute inset-0 w-full h-full">
          <Image src={imageSrc || "/placeholder.svg"} alt={title} fill className="object-cover" />
        </div>
      )}
      <div className="flex flex-col items-center relative z-10 bg-gray-900/50 p-4 rounded-2xl backdrop-blur-sm">
        <div className="mb-4 rounded-full bg-white/80 p-2 dark:bg-slate-100/90">{icon}</div>

        {/* Enhanced Number Display */}
        <div className="relative mb-6 mt-2">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400 rounded-full blur-md opacity-75 animate-pulse"></div>
          <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full shadow-lg">
            <div className="absolute inset-0.5 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{number}</span>
            </div>
            <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-blue-50 shadow-md dark:bg-slate-200"></div>
            <div className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-blue-50 shadow-md dark:bg-slate-200"></div>
          </div>
        </div>
      </footer>
    </div>
  )
}
