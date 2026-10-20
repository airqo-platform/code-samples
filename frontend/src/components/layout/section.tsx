import { cn } from "@/lib/utils"
import type React from "react"

export function Section({
  className,
  children,
  id,
  muted = false,
  compact = false,
}: {
  className?: string
  children: React.ReactNode
  id?: string
  muted?: boolean
  compact?: boolean
}) {
  return (
    <section
      id={id}
      className={cn(
        "w-full",
        compact ? "py-8 md:py-10" : "py-12 md:py-16",
        muted && "bg-muted/40",
        className,
      )}
    >
      {children}
    </section>
  )
}
