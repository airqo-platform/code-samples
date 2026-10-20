import type { ReactNode } from "react"
import Image from "next/image"

export function ProcessCard({
  icon,
  number,
  title,
  description,
  imageSrc,
}: {
  icon: ReactNode
  number: string
  title: string
  description: string
  imageSrc?: string
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-sm">
      {imageSrc && (
        <div className="relative aspect-[16/7] w-full overflow-hidden border-b border-border bg-muted/40">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-muted-foreground">{number}</span>
          <span className="text-primary">{icon}</span>
        </div>
        <h3 className="mt-4 text-base font-medium text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
