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
    <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {imageSrc && (
        <div className="absolute inset-0 w-full h-full">
          <Image src={imageSrc} alt={title} fill className="object-cover brightness-75" />
        </div>
      )}
      <div className="relative z-10 flex flex-col items-center rounded-2xl bg-slate-950/70 p-5 text-white backdrop-blur-sm">
        <div className="mb-4 rounded-full bg-white/80 p-2">{icon}</div>
        <div className="relative mb-6 mt-2">
          <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full shadow-lg">
            <span className="text-2xl font-bold text-white">{number}</span>
          </div>
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-center font-medium text-white/90">{description}</p>
      </div>
    </div>
  )
}
