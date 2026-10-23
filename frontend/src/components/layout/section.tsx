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
        compact ? "py-8" : "py-10 md:py-14",
        muted && "bg-muted/40",
        className,
      )}
    >
      {children}
    </section>
  )
}
