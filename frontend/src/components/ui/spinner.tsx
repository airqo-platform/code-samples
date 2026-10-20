import * as React from "react"
import { LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const

export type SpinnerSize = keyof typeof sizeMap

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize
  label?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "sm", label, ...props }, ref) => {
    const hasLabel = Boolean(label)
    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-2", className)}
        role={hasLabel ? "status" : undefined}
        aria-label={label}
        {...props}
      >
        <LoaderCircle
          className={cn(
            sizeMap[size],
            "animate-spin motion-reduce:animate-none",
            hasLabel ? "" : "text-primary",
          )}
          aria-hidden="true"
        />
        {hasLabel && <span>{label}</span>}
      </div>
    )
  },
)
Spinner.displayName = "Spinner"

export { Spinner }
