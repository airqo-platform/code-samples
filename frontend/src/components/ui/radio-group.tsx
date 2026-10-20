"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface RadioGroupContextValue {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({})

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, name, children, ...props }, ref) => {
    const generatedName = React.useId()
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange, name: name ?? generatedName }}>
        <div
          ref={ref}
          role="radiogroup"
          className={cn("grid gap-3", className)}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  },
)
RadioGroup.displayName = "RadioGroup"

export interface RadioGroupItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: string
  id?: string
  disabled?: boolean
  children?: React.ReactNode
}

const RadioGroupItem = React.forwardRef<HTMLDivElement, RadioGroupItemProps>(
  ({ className, value, id, disabled, children, ...props }, ref) => {
    const ctx = React.useContext(RadioGroupContext)
    const generatedId = React.useId()
    const inputId = id ?? `${generatedId}-${value}`
    const isChecked = ctx.value === value
    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <label htmlFor={inputId} className="cursor-pointer">
          <input
            type="radio"
            id={inputId}
            name={ctx.name}
            value={value}
            checked={isChecked}
            disabled={disabled}
            onChange={(e) => ctx.onValueChange?.(e.target.value)}
            className="peer sr-only"
          />
          <div className="relative rounded-xl border-2 border-border p-3 transition peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/20 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
            {isChecked && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
                <Check className="h-3 w-3" />
              </span>
            )}
            {children}
          </div>
        </label>
      </div>
    )
  },
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
