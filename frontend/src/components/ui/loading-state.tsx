import * as React from "react"

import { cn } from "@/lib/utils"
import { Spinner, type SpinnerSize } from "@/components/ui/spinner"

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize
  text?: string
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ size = "md", text, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center px-4 py-12 text-center",
        className,
      )}
      {...props}
    >
      <Spinner size={size} className="mb-4 text-primary" />
      {text ? <p className="text-sm text-muted-foreground">{text}</p> : null}
      {children}
    </div>
  ),
)
LoadingState.displayName = "LoadingState"

export { LoadingState }
