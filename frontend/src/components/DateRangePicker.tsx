"use client"

import { useState } from "react"
import { Calendar } from "@components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
  className?: string
}
export interface DateRange {
  startDate?: Date
  endDate?: Date
}
export interface DateRangeOption {
  label: string
  value: string
  days: number
}
export function DateRangePicker({ dateRange, onDateRangeChange, className }: DateRangePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Predefined date range options
  const dateRangeOptions: DateRangeOption[] = [
    { label: "Last 7 days", value: "7days", days: 7 },
    { label: "Last 14 days", value: "14days", days: 14 },
    { label: "Last month", value: "1month", days: 30 },
    { label: "Last quarter", value: "3months", days: 90 },
    { label: "Last 6 months", value: "6months", days: 180 },
  ]

  const handleDateRangeSelect = (option: DateRangeOption) => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - option.days)

    onDateRangeChange({ startDate, endDate })
    setIsCalendarOpen(false)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 mb-4">
        {dateRangeOptions.map((option) => (
          <Button
            key={option.value}
            variant="outline"
            size="sm"
            onClick={() => handleDateRangeSelect(option)}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.startDate && dateRange?.endDate ? (
              <>
                {format(dateRange.startDate, "PPP")} - {format(dateRange.endDate, "PPP")}
              </>
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.startDate}
            selected={{
              from: dateRange?.startDate,
              to: dateRange?.endDate,
            }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onDateRangeChange({
                  startDate: range.from,
                  endDate: range.to,
                })
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

