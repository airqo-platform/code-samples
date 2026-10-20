import type { LucideIcon } from "lucide-react"
import { ArrowUpRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface FeatureCardProps {
  title: string
  description: string
  Icon: LucideIcon
  imageSrc: string
  href: string
  openInNewTab?: boolean
  priority?: boolean
  className?: string
  imageClassName?: string
  "aria-label"?: string
}

export function FeatureCard({
  title,
  description,
  Icon,
  imageSrc,
  href,
  openInNewTab = false,
  priority = false,
  className,
  imageClassName,
  "aria-label": ariaLabel,
}: FeatureCardProps) {
  const linkClasses = `group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className ?? ""}`

  const inner = (
    <>
      <div className={`relative aspect-[16/9] w-full overflow-hidden bg-muted/40 ${imageClassName ?? ""}`}>
        <Image
          src={imageSrc}
          alt={title}
          fill
          style={{ objectFit: "cover" }}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <h3 className="text-base font-medium leading-6 text-foreground">{title}</h3>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <span
          aria-hidden="true"
          className="mt-auto inline-flex items-center pt-3 text-xs font-medium text-primary"
        >
          <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </>
  )

  if (openInNewTab) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel ?? title} className={linkClasses}>
        {inner}
      </a>
    )
  }

  return (
    <Link href={href} aria-label={ariaLabel ?? title} className={linkClasses}>
      {inner}
    </Link>
  )
}
