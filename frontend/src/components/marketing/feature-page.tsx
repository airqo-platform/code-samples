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
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <div className="max-w-3xl space-y-5">
              <Badge variant="accent">
                <Icon className="h-4 w-4" />
                {badge}
              </Badge>
              <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">{title}</h1>
              <p className="text-base leading-7 text-muted-foreground">{description}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  {primaryAction.external ? (
                    <a href={primaryAction.href} target="_blank" rel="noopener noreferrer">
                      {primaryAction.label}
                    </a>
                  ) : (
                    <Link href={primaryAction.href}>{primaryAction.label}</Link>
                  )}
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <h3 className="text-lg font-medium">{info.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{info.description}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-md border border-border bg-muted/50 p-4">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Inputs</p>
                    <p className="text-sm leading-6 text-muted-foreground">{info.inputs}</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/50 p-4">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Outputs</p>
                    <p className="text-sm leading-6 text-muted-foreground">{info.outputs}</p>
                  </div>
                </div>
              </div>
              <figure className="relative m-0 aspect-[10/7] overflow-hidden rounded-md border border-border bg-muted/40">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width:1024px) 40vw, 100vw"
                  className="object-cover"
                />
                <figcaption className="absolute bottom-3 left-3 rounded-md bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground">
                  {image.caption}
                </figcaption>
              </figure>
            </div>
          </div>
        </Container>
      </Section>

      {/* Methods */}
      <Section compact>
        <Container>
          <SectionHeading title={methodTitle} />
          <div className={["mt-6 grid gap-4", methodGrid].join(" ")}>
            {methods.map((method) => {
              const MethodIcon = method.icon
              return (
                <div key={method.title} className="h-full rounded-md border border-border bg-card p-5 shadow-sm">
                  <MethodIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-3 text-base font-medium">{method.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{method.description}</p>
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
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-medium tracking-tight">{deliverables.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{deliverables.description}</p>
              <ul className="mt-4 space-y-3">
                {deliverables.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                    <span className="text-sm leading-6 text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-6 sm:p-8">
              <h2 className="text-2xl font-medium tracking-tight">{panel.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{panel.description}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {panel.items.map((item) => (
                  <div key={item.title} className="rounded-md border border-border bg-card p-4">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button asChild variant="default">
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
