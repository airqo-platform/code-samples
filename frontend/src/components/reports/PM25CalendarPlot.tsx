"use client"

import { CalendarDays } from "lucide-react"
import type { ReactNode } from "react"
import type { SiteData } from "@/lib/types"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DAY_MS = 24 * 60 * 60 * 1000

type DailyAverage = { dateKey: string; timestamp: number; value: number }
type CalendarCell = { day: number; dateKey: string; value: number | null } | null

const toDateKey = (timestamp: string) => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}

const getDailyAverages = (sites: SiteData[]) => {
  const valuesByDate = new Map<string, number[]>()
  sites.forEach((site) => {
    site.reportMeasurements?.forEach((measurement) => {
      if (!Number.isFinite(measurement.value)) return
      const dateKey = toDateKey(measurement.timestamp)
      if (!dateKey) return
      valuesByDate.set(dateKey, [...(valuesByDate.get(dateKey) || []), measurement.value])
    })
  })

  return Array.from(valuesByDate.entries())
    .map(([dateKey, values]): DailyAverage => ({
      dateKey,
      timestamp: Date.parse(`${dateKey}T00:00:00Z`),
      value: values.reduce((sum, value) => sum + value, 0) / values.length,
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
}

const getCalendarCells = (year: number, month: number, valuesByDate: Map<string, number>): CalendarCell[] => {
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const mondayOffset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells: CalendarCell[] = Array.from({ length: mondayOffset }, () => null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    cells.push({ day, dateKey, value: valuesByDate.get(dateKey) ?? null })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const getCellStyle = (value: number | null) => {
  if (value === null) return { backgroundColor: "#e5e7eb", color: "#6b7280" }
  if (value <= 12) return { backgroundColor: "#22863a", color: "#ffffff" }
  if (value <= 35.4) return { backgroundColor: "#fdd835", color: "#111827" }
  if (value <= 55.4) return { backgroundColor: "#fb8c00", color: "#111827" }
  return { backgroundColor: "#dc2626", color: "#ffffff" }
}

const LegendItem = ({ color, children }: { color: string; children: ReactNode }) => (
  <div className="flex items-center gap-1.5 whitespace-nowrap">
    <span className="h-3 w-6 rounded-sm border border-black/10" style={{ backgroundColor: color }} />
    <span>{children}</span>
  </div>
)

export function PM25CalendarPlot({ sites }: { sites: SiteData[] }) {
  const dailyAverages = getDailyAverages(sites)
  if (dailyAverages.length === 0) return null

  const valuesByDate = new Map(dailyAverages.map((average) => [average.dateKey, average.value]))
  const years = Array.from(new Set(dailyAverages.map((average) => new Date(average.timestamp).getUTCFullYear())))

  return (
    <section className="pdf-keep-together overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
      {years.map((year, yearIndex) => {
        const yearValues = dailyAverages.filter((average) => new Date(average.timestamp).getUTCFullYear() === year)
        const values = yearValues.map((average) => average.value)
        const elapsedDays = Math.round((yearValues[yearValues.length - 1].timestamp - yearValues[0].timestamp) / DAY_MS) + 1
        const missingDays = Math.max(0, elapsedDays - yearValues.length)
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length
        const sortedValues = [...values].sort((a, b) => a - b)
        const middle = Math.floor(sortedValues.length / 2)
        const median = sortedValues.length % 2 ? sortedValues[middle] : (sortedValues[middle - 1] + sortedValues[middle]) / 2
        const monthsWithData = new Set(
          yearValues.map((average) => new Date(average.timestamp).getUTCMonth()),
        )

        return (
          <div key={year} className={yearIndex > 0 ? "border-t border-gray-200" : undefined}>
            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4 text-center">
              <h4 className="flex items-center justify-center gap-2 text-lg font-bold text-blue-800 md:text-xl">
                <CalendarDays className="h-5 w-5" />
                Calendar Plot of Daily Average PM<sub>2.5</sub>: {year}
              </h4>
              <p className="mt-1 text-xs text-slate-600">Daily averages across the selected monitoring sites</p>
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-5 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {MONTH_NAMES.map((monthName, month) => ({ monthName, month }))
                .filter(({ month }) => monthsWithData.has(month))
                .map(({ monthName, month }) => (
                <div key={monthName} className="min-w-0">
                  <h5 className="mb-1 text-center text-sm font-bold text-blue-800">{monthName}</h5>
                  <div className="grid grid-cols-7 gap-px overflow-hidden rounded bg-white">
                    {WEEKDAYS.map((weekday) => <div key={weekday} className="pb-1 text-center text-[9px] font-semibold text-slate-600">{weekday}</div>)}
                    {getCalendarCells(year, month, valuesByDate).map((cell, index) => cell ? (
                      <div
                        key={cell.dateKey}
                        className="flex min-h-10 flex-col justify-between p-1 text-[8px] leading-none"
                        style={getCellStyle(cell.value)}
                        title={cell.value === null ? `${cell.dateKey}: No data` : `${cell.dateKey}: ${cell.value.toFixed(1)} \u00b5g/m\u00b3`}
                      >
                        <span className="font-semibold">{cell.day}</span>
                        {cell.value !== null && (
                          <span className="self-center pb-0.5 font-bold">{cell.value.toFixed(1)}</span>
                        )}
                      </div>
                    ) : <div key={`empty-${month}-${index}`} className="min-h-10 bg-slate-50" aria-hidden="true" />)}
                  </div>
                </div>
                ))}
            </div>

            <div className="space-y-3 border-t border-gray-100 px-4 py-4 text-xs text-slate-700">
              <div className="mx-auto w-fit rounded-lg border border-blue-500 px-3 py-1.5 text-center">
                Daily mean: {mean.toFixed(1)} {"\u00b5g/m\u00b3"}&nbsp; | &nbsp;Daily median: {median.toFixed(1)} {"\u00b5g/m\u00b3"}&nbsp; | &nbsp;Days with data: {yearValues.length}&nbsp; | &nbsp;Missing days: {missingDays}
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                <LegendItem color="#22863a">Good: 0-12.0 {"\u00b5g/m\u00b3"}</LegendItem>
                <LegendItem color="#fdd835">Moderate: 12.1-35.4 {"\u00b5g/m\u00b3"}</LegendItem>
                <LegendItem color="#fb8c00">Sensitive Groups: 35.5-55.4 {"\u00b5g/m\u00b3"}</LegendItem>
                <LegendItem color="#dc2626">Unhealthy: {"\u226555.5 \u00b5g/m\u00b3"}</LegendItem>
                <LegendItem color="#e5e7eb">Missing data</LegendItem>
              </div>
              <p className="text-center text-[10px] text-slate-500">
                Values inside calendar cells are daily average calibrated PM<sub>2.5</sub> concentrations in {"\u00b5g/m\u00b3"}. Missing days are counted between the first and last available dates shown for the year.
              </p>
            </div>
          </div>
        )
      })}
    </section>
  )
}
