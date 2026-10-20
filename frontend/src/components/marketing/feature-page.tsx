import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PageShell } from "@/components/layout/page-shell"
import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/layout/section-heading"
import { Button } from "@/components/ui/button"

export type FeatureAction = { href: string; label: string; external?: boolean }
export type FeatureMethod = { icon: LucideIcon; title: string; description: string }

export type FeaturePageProps = {
  badge: string
  Icon: LucideIcon
  title: string
  description: string
  primaryAction: FeatureAction
  info: { title: string; description: string; inputs: string; outputs: string }
  image: { src: string; alt: string; caption: string }
  methodTitle?: string
  methods: FeatureMethod[]
  deliverables: { title: string; description: string; items: string[] }
  panel: {
    title: string
    description: string
    items: { title: string; description: string }[]
    action: FeatureAction
  }
  extraSection?: ReactNode
}

const methodGridMap: Record<3 | 4, string> = {
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
}

export function FeaturePage({
  badge,
  Icon,
  title,
  description,
  primaryAction,
  info,
  image,
  methodTitle = "Our approach",
  methods,
  deliverables,
  panel,
  extraSection,
}: FeaturePageProps) {
  const methodGrid = methodGridMap[methods.length as 3 | 4] ?? "sm:grid-cols-2 lg:grid-cols-3"

  return (
    <PageShell>
      {/* Hero */}
      <Section>
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-6">
              <Badge variant="accent">
                <Icon className="h-4 w-4" />
                {badge}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="xl">
                  {primaryAction.external ? (
                    <a href={primaryAction.href} target="_blank" rel="noopener noreferrer">
                      {primaryAction.label}
                    </a>
                  ) : (
                    <Link href={primaryAction.href}>{primaryAction.label}</Link>
                  )}
                </Button>
                <Button asChild size="xl" variant="outline">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="surface p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{info.title}</h3>
                    <p className="text-muted-foreground">{info.description}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="surface-muted p-4">
                    <p className="mb-1 text-sm font-semibold text-accent-foreground">Inputs</p>
                    <p className="text-sm text-muted-foreground">{info.inputs}</p>
                  </div>
                  <div className="surface-muted p-4">
                    <p className="mb-1 text-sm font-semibold text-accent-foreground">Outputs</p>
                    <p className="text-sm text-muted-foreground">{info.outputs}</p>
                  </div>
                </div>
              </div>
              <div className="relative aspect-[10/7] overflow-hidden rounded-2xl border border-border">
                <div className="absolute inset-0 z-10 bg-gradient-to-tr from-blue-950/50 via-transparent to-transparent" />
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width:1024px) 40vw, 100vw"
                  className="object-cover"
                />
                <span className="absolute bottom-4 left-4 z-20 rounded-lg bg-background/90 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur">
                  {image.caption}
                </span>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Methods */}
      <Section>
        <Container>
          <SectionHeading title={methodTitle} />
          <div className={["mt-8 grid gap-4", methodGrid].join(" ")}>
            {methods.map((method) => {
              const MethodIcon = method.icon
              return (
                <div key={method.title} className="surface h-full p-5 transition hover:shadow-md">
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <MethodIcon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{method.title}</h3>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
              )
            })}
          </div>
        </Container>
      </Section>

      {/* Extra section (interactive-mapping only) */}
      {extraSection}

      {/* Deliverables */}
      <Section muted>
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div className="surface p-6 sm:p-8">
              <h2 className="text-2xl font-bold">{deliverables.title}</h2>
              <p className="mt-2 text-muted-foreground">{deliverables.description}</p>
              <ul className="mt-4 space-y-3">
                {deliverables.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-6 text-white shadow-lg sm:p-8">
              <h2 className="text-2xl font-bold">{panel.title}</h2>
              <p className="mt-2 text-blue-50">{panel.description}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {panel.items.map((item) => (
                  <div key={item.title} className="rounded-xl border border-white/20 bg-white/10 p-4">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-blue-50">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button asChild variant="secondary" className="bg-white text-blue-800 hover:bg-blue-50">
                  {panel.action.external ? (
                    <a href={panel.action.href} target="_blank" rel="noopener noreferrer">
                      {panel.action.label}
                    </a>
                  ) : (
                    <Link href={panel.action.href}>{panel.action.label}</Link>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </PageShell>
  )
}
