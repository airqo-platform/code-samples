"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { PageShell } from "@/components/layout/page-shell"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"

function NotFoundContent() {
  const pathname = usePathname()
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Container size="narrow">
        <div className="surface p-8 text-center">
          <h1 className="text-7xl font-bold text-foreground">404</h1>
          <p className="mt-4 text-xl text-muted-foreground">Oops! The page you are looking for does not exist.</p>
          <p className="mt-2 text-base text-muted-foreground">
            You tried to access <span className="font-mono rounded bg-muted px-1.5 py-0.5 text-foreground break-all">{pathname}</span>, but it is not available.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/">Return to home</Link>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default function NotFound() {
  return (
    <PageShell footer={false}>
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading...</div>}>
        <NotFoundContent />
      </Suspense>
    </PageShell>
  )
}
