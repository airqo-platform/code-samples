"use client"

import { useState, useEffect } from "react"
import { Button } from "@/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { format, subDays, subMonths, subQuarters, startOfDay, endOfDay, differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date, endDate: Date) => void
  maxDays?: number
  startDate?: Date
  endDate?: Date
  className?: string
}

type DatePreset = {
  name: string
  getValue: () => { from: Date; to: Date }
}

export function DateRangePicker({
  onDateRangeChange,
  maxDays = 120,
  startDate = subDays(new Date(), 7),
  endDate = new Date(),
  className,
}: DateRangePickerProps) {
  const [date, setDate] = useState<{ from: Date; to: Date }>({
    from: startDate,
    to: endDate,
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [activePreset, setActivePreset] = useState<string>("last7Days")

  const presets: DatePreset[] = [
    {
      name: "Last 7 days",
      getValue: () => ({
        from: startOfDay(subDays(new Date(), 6)),
        to: endOfDay(new Date()),
      }),
    },
    {
      name: "Last 14 days",
      getValue: () => ({
        from: startOfDay(subDays(new Date(), 13)),
        to: endOfDay(new Date()),
      }),
    },
    {
      name: "Last 30 days",
      getValue: () => ({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
      }),
    },
    {
      name: "Last month",
      getValue: () => ({
        from: startOfDay(subMonths(new Date(), 1)),
        to: endOfDay(new Date()),
      }),
    },
    {
      name: "Last quarter",
      getValue: () => ({
        from: startOfDay(subQuarters(new Date(), 1)),
        to: endOfDay(new Date()),
      }),
    },
    {
      name: "Last 120 days",
      getValue: () => ({
        from: startOfDay(subDays(new Date(), 119)),
        to: endOfDay(new Date()),
      }),
    },
  ]

 
  const onPresetSelect = (preset: DatePreset) => {
    const newDate = preset.getValue()
    setDate(newDate)
    setActivePreset(preset.name)
    setIsCalendarOpen(false)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row gap-2">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex flex-col sm:flex-row gap-2 p-3 border-b">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant={activePreset === preset.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPresetSelect(preset)}
                  className="text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
            <Calendar
              mode="range"
              defaultMonth={date.from}
              selected={{ from: date.from, to: date.to }}
              onSelect={(selectedDate) => {
                if (selectedDate?.from && selectedDate?.to) {
                  // Check if date range exceeds max days
                  const daysDiff = differenceInDays(selectedDate.to, selectedDate.from)
                  if (daysDiff > maxDays) {
                    // Adjust the from date to respect max days
                    selectedDate.from = subDays(selectedDate.to, maxDays)
                  }
                  setDate(selectedDate as { from: Date; to: Date })
                  setActivePreset("custom")
                }
              }}
              numberOfMonths={2}
              disabled={(date) => date > new Date()}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <span>Quick Select</span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0">
            <div className="flex flex-col">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="ghost"
                  className="justify-start font-normal rounded-none h-9"
                  onClick={() => onPresetSelect(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

