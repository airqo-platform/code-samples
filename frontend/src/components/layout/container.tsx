import { cn } from "@/lib/utils"
import type React from "react"

type ContainerSize = "default" | "narrow" | "wide"

const sizeMap: Record<ContainerSize, string> = {
  default: "max-w-7xl",
  narrow: "max-w-4xl",
  wide: "max-w-[90rem]",
}

export function Container({
  className,
  children,
  size = "default",
}: {
  className?: string
  children: React.ReactNode
  size?: ContainerSize
}) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeMap[size], className)}>
      {children}
    </div>
  )
}
