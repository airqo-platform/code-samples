import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface FieldProps {
  label: React.ReactNode
  htmlFor: string
  description?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  className?: string
  children: React.ReactNode
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ label, htmlFor, description, error, required, className, children }, ref) => {
    const descriptionId = `${htmlFor}-description`
    const errorId = `${htmlFor}-error`
    return (
      <div ref={ref} className={cn("space-y-1.5", className)}>
        <Label htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
          )}
        </Label>
        {children}
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {description ? (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    )
  },
)
Field.displayName = "Field"

export { Field }
