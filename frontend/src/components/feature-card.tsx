import type { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  title: string
  description: string
  Icon: LucideIcon
}

export function FeatureCard({ title, description, Icon }: FeatureCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 transition-all hover:shadow-lg">
      <div className="mb-4">
        <Icon className="h-12 w-12 text-blue-500" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
