import Link from "next/link"
import { Container } from "./container"

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-border bg-muted/40">
      <Container className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {year} AirQo. All rights reserved.
        </p>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <Link href="/map" className="transition-colors hover:text-foreground">
            Map
          </Link>
          <Link href="/reports" className="transition-colors hover:text-foreground">
            Reports
          </Link>
        </nav>
      </Container>
    </footer>
  )
}
