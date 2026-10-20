import type { LucideIcon } from "lucide-react"
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
  const linkClasses = `group relative block h-64 overflow-hidden rounded-2xl shadow-lg ring-ring transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className ?? ""}`

  const inner = (
    <>
      <Image
        src={imageSrc}
        alt={title}
        fill
        style={{ objectFit: "cover" }}
        className={`transition-transform duration-300 group-hover:scale-105 ${imageClassName ?? ""}`}
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
      <div className="absolute right-4 top-4">
        <Icon className="h-6 w-6 text-white opacity-80" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="line-clamp-3 text-sm text-white/90">{description}</p>
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
