import { cn } from "@/lib/utils"
import type React from "react"
import Navigation from "@/components/navigation/navigation"
import { SiteFooter } from "./site-footer"

export function PageShell({
  children,
  className,
  footer = true,
  mainClassName,
}: {
  children: React.ReactNode
  className?: string
  footer?: boolean
  mainClassName?: string
}) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-background text-foreground", className)}>
      <Navigation />
      <main className={cn("flex-1", mainClassName)}>{children}</main>
      {footer && <SiteFooter />}
    </div>
  )
}
