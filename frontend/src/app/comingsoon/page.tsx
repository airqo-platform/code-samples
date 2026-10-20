import Link from "next/link"
import { PageShell } from "@/components/layout/page-shell"
import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
import { SectionHeading } from "@/components/layout/section-heading"
import { Button } from "@/components/ui/button"

export default function ComingSoon() {
  return (
    <PageShell>
      <Section compact>
        <Container size="narrow">
          <SectionHeading
            eyebrow="Coming Soon"
            title="AirQo AI: Coming Soon"
            description="Revolutionizing air quality monitoring in African cities with AI-powered insights. Get ready for real-time data, advanced analytics, and community-driven solutions!"
          />
          <div className="mx-auto mt-8 max-w-md text-center surface p-6">
            <h2 className="text-xl font-semibold mb-4">Stay in the Loop</h2>
            <p className="text-muted-foreground">Newsletter sign-up is not open yet.</p>
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
