import * as React from "react"
import { cn } from "@/lib/utils"

const sizeMap = {
  sm: { size: "16px", stroke: "2px" },
  md: { size: "24px", stroke: "3px" },
  lg: { size: "50px", stroke: "8px" },
} as const

export type SpinnerSize = keyof typeof sizeMap

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize
  label?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "sm", label, children, ...props }, ref) => {
    const hasLabel = Boolean(label)
    const dims = sizeMap[size]
    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-2", className)}
        role={hasLabel ? "status" : undefined}
        aria-label={label}
        {...props}
      >
        <span
          aria-hidden="true"
          className="SecondaryMainloader block"
          style={
            {
              "--loader-size": dims.size,
              "--loader-stroke": dims.stroke,
            } as React.CSSProperties
          }
        />
        {children}
        {hasLabel && <span>{label}</span>}
      </div>
    )
  },
)
Spinner.displayName = "Spinner"

export { Spinner }
