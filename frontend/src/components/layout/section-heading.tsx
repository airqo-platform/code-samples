import { cn } from "@/lib/utils"
import type React from "react"
import { Badge } from "@/components/ui/badge"

type Align = "center" | "left"

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  as: Tag = "h2",
  className,
}: {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: Align
  as?: "h1" | "h2" | "h3" | "h4"
  className?: string
}) {
  const isCenter = align === "center"
  return (
    <div
      className={cn(
        isCenter && "mx-auto max-w-3xl text-center",
        className,
      )}
    >
      {eyebrow && (
        <Badge variant="accent">{eyebrow}</Badge>
      )}
      <Tag
        className={cn(
          "text-3xl font-bold tracking-tight md:text-4xl",
          eyebrow && "mt-4",
          isCenter && "text-center",
        )}
      >
        {title}
      </Tag>
      {description && (
        <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </div>
  )
}
