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
  const [isTickerActive, setIsTickerActive] = useState(true)
  const [isTickerVisible, setIsTickerVisible] = useState(true)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)

  useEffect(() => {
    const savedCountry = window.localStorage.getItem(FORECAST_TICKER_COUNTRY_KEY)?.trim() || ""
    const savedLocationState = window.localStorage.getItem(FORECAST_TICKER_LOCATION_STATE_KEY)
    const savedActive = window.localStorage.getItem(FORECAST_TICKER_ACTIVE_KEY)
    const savedVisible = window.localStorage.getItem(FORECAST_TICKER_VISIBLE_KEY)

    if (savedCountry) {
      setVisitorCountry(savedCountry)
      setLocationState("ready")
    } else if (savedLocationState === "denied" || savedLocationState === "unavailable") {
      setLocationState(savedLocationState)
    }

    if (savedActive !== null) setIsTickerActive(savedActive === "true")
    if (savedVisible !== null) setIsTickerVisible(savedVisible === "true")
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
    Promise.all([getDailyForecastCollection(), getMapNodes()])
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
      window.localStorage.setItem(FORECAST_TICKER_LOCATION_STATE_KEY, "unavailable")
      return
    }

    setLocationState("requesting")
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const country = await resolveCountry(coords.latitude, coords.longitude, mapNodes)
        if (country) {
          setVisitorCountry(country)
          setLocationState("ready")
          window.localStorage.setItem(FORECAST_TICKER_COUNTRY_KEY, country)
          window.localStorage.setItem(FORECAST_TICKER_LOCATION_STATE_KEY, "ready")
        } else {
          setLocationState("unavailable")
          window.localStorage.removeItem(FORECAST_TICKER_COUNTRY_KEY)
          window.localStorage.setItem(FORECAST_TICKER_LOCATION_STATE_KEY, "unavailable")
        }
      },
      () => {
        setLocationState("denied")
        window.localStorage.removeItem(FORECAST_TICKER_COUNTRY_KEY)
        window.localStorage.setItem(FORECAST_TICKER_LOCATION_STATE_KEY, "denied")
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30 * 60 * 1000 },
    )
  }

  const tickerItems = useMemo<ForecastTickerItem[]>(() => {
    if (!collection?.forecasts?.length || !visitorCountry) return []

    const countryBySiteId = new Map(
      mapNodes
        .filter((node) => node.site_id && node.siteDetails?.country)
        .map((node) => [node.site_id, node.siteDetails.country!.trim().toLowerCase()]),
    )

    return collection.forecasts
      .filter((site) => countryBySiteId.get(site.site_details.site_id) === visitorCountry.toLowerCase())
      .map((site) => {
        const forecast = site.forecasts?.[0]
        if (!forecast) return null
        return {
          id: `${site.site_details.site_id}-${forecast.date}`,
          siteName: site.site_details.site_name || "AirQo site",
          country: visitorCountry,
          forecast,
        }
      })
      .filter((item): item is ForecastTickerItem => Boolean(item))
      .slice(0, 24)
  }, [collection, mapNodes, visitorCountry])

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
    <section className="border-y border-blue-100 bg-blue-50 text-slate-900" aria-label="Daily air quality forecast">
      <div className="flex min-h-16 items-stretch overflow-hidden">
        <div
          className="relative z-10 flex w-12 shrink-0 items-center justify-center gap-2 bg-blue-700 px-2 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-[12px_0_24px_rgba(37,99,235,0.16)] sm:w-auto sm:px-6"
          aria-label="Daily forecast"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
          </span>
          <span className="hidden sm:inline">Daily forecast</span>
        </div>

        <div className="forecast-ticker relative flex min-w-0 flex-1 items-center overflow-hidden">
          {loading ? (
            <p className="px-6 text-sm text-slate-600">Loading today&apos;s air quality outlook...</p>
          ) : locationState !== "ready" ? (
            <div className="flex w-full flex-col items-stretch gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {locationState === "denied"
                    ? "Location access was not granted"
                    : locationState === "unavailable"
                      ? "We could not determine your country"
                      : "See forecasts for your country"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  Your location is used only to choose country-specific AirQo forecast sites.
                </p>
              </div>
              <button
                type="button"
                onClick={requestLocation}
                disabled={locationState === "requesting" || mapNodes.length === 0}
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <Locate className="h-4 w-4" />
                {locationState === "requesting" ? "Finding country..." : "Use my location"}
              </button>
            </div>
          ) : renderedItems.length > 0 ? (
            <div className={`forecast-ticker-track flex w-max items-center ${isTickerActive ? "" : "forecast-ticker-paused"}`}>
              {renderedItems.map((item, index) => {
                const pm25 = item.forecast.forecast.pm2_5_mean
                const temperature = item.forecast.met?.air_temperature
                const label =
                  item.forecast.aqi.aqi_category ||
                  item.forecast.aqi.aqi_color_name ||
                  item.forecast.aqi.label ||
                  "Air quality outlook"
                const color = normalizeColor(item.forecast.aqi.aqi_color)

                return (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex shrink-0 items-center gap-3 border-r border-blue-100 px-4 py-3 sm:px-6"
                  >
                    <Image
                      src={getAqiImageByCategory(label)}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 object-contain"
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-slate-950">{item.siteName}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {formatForecastDate(item.forecast.date)}
                    </span>
                    <span className="h-2.5 w-2.5 rounded-full ring-4 ring-white" style={{ backgroundColor: color }} />
                    <span className="text-sm text-slate-700">{label}</span>
                    {typeof pm25 === "number" && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200">
                        PM<sub>2.5</sub> {pm25.toFixed(1)} µg/m³
                      </span>
                    )}
                    {typeof temperature === "number" && (
                      <span className="text-xs text-blue-700">🌡️ {temperature.toFixed(0)}°C</span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="px-6 text-sm text-slate-600">
              🌬️ No daily forecasts are currently available for {visitorCountry}. Open the map for nearby measurements.
            </p>
          )}
        </div>
        <div className="relative z-10 flex shrink-0 items-center gap-1 border-l border-blue-100 bg-blue-50 px-1 sm:px-2">
          {renderedItems.length > 0 && (
            <button
              type="button"
              onClick={() => setIsTickerActive((current) => !current)}
              className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-100"
              aria-label={isTickerActive ? "Pause daily forecast ticker" : "Resume daily forecast ticker"}
              title={isTickerActive ? "Pause forecast" : "Resume forecast"}
            >
              {isTickerActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsTickerVisible(false)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-100 hover:text-blue-700"
            aria-label="Close daily forecast ticker"
            title="Close forecast"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] text-slate-950">
      <Navigation />
      <DailyForecastTicker />

      <main>
        <section className="relative overflow-hidden bg-blue-50">
          <div className="absolute inset-0">
            <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-blue-300/35 blur-3xl" />
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:54px_54px]" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                AI for cleaner African cities
              </div>
              <h1 className="mt-6 max-w-3xl text-3xl font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                Turn air quality data into decisions that matter.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Monitor pollution, anticipate tomorrow&apos;s conditions, and plan stronger sensor networks with AirQo&apos;s
                AI-powered environmental intelligence platform.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/map"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
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
            </Link>
          </div>
        </section>

        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">One connected platform</p>
                <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                  From street-level evidence to city-level action.
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-slate-600">
                Choose a workflow and move from observation to a practical environmental decision without leaving AirQo AI.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {capabilityCards.map((card) => {
                const Icon = card.icon
                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative h-52 overflow-hidden">
                      <Image src={card.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                      <div className={`absolute left-5 top-5 rounded-2xl p-3 text-white shadow-lg ${card.accent}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold">{card.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                        Open tool <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
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
        </section>

        <section className="px-5 pb-16 sm:pb-20 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 overflow-hidden rounded-[2rem] bg-blue-700 px-6 py-10 text-white sm:px-10 lg:flex-row lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100">
                <BarChart3 className="h-4 w-4" />
                Evidence for action
              </div>
              <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight">
                Make your next air quality decision with clearer evidence.
              </h2>
            </div>
            <Link
              href="/reports"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-blue-800 transition hover:bg-blue-50"
            >
              Explore reports <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} AirQo. Clean air intelligence for African cities.</p>
          <div className="flex gap-5">
            <Link href="/about" className="hover:text-blue-700">About</Link>
            <Link href="/map" className="hover:text-blue-700">Map</Link>
            <Link href="/reports" className="hover:text-blue-700">Reports</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
