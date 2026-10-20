import Link from "next/link"
import { PageShell } from "@/components/layout/page-shell"
import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function ComingSoon() {
  return (
    <PageShell>
      <Section compact>
        <Container size="narrow">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="accent">Coming Soon</Badge>
            <h1 className="mt-4 text-2xl font-medium tracking-tight">AirQo AI: Coming Soon</h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Revolutionizing air quality monitoring in African cities with AI-powered insights. Get ready for real-time
              data, advanced analytics, and community-driven solutions!
            </p>
          </div>
          <div className="mx-auto mt-6 max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
            <h2 className="text-lg font-medium">Stay in the Loop</h2>
            <p className="mt-2 text-sm text-muted-foreground">Newsletter sign-up is not open yet.</p>
            <div className="mt-4">
              <Button asChild>
                <a href="https://airqo.net/contact-us" target="_blank" rel="noopener noreferrer">Contact AirQo</a>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Learn more about us at{" "}
              <Link href="https://ai.airqo.net" className="text-primary hover:underline">
                ai.airqo.net
              </Link>
            </p>
          </div>
        </Container>
      </Section>
    </PageShell>
  )
}
