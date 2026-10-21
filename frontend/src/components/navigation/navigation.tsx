"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { ArrowUpRight, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSiteSettings } from "@/hooks/use-site-settings"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function Navigation() {
  const pathname = usePathname()
  const settings = useSiteSettings()
  const navItems = settings.pages
    .filter((page) => page.enabled)
    .map((page) => ({ name: page.name, href: page.path }))

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 px-2 pb-2 pt-2 backdrop-blur-sm">
      <div className="mx-auto flex h-12 w-full items-center justify-between gap-3 rounded-md border border-border bg-card px-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" aria-label="AirQo home" className="flex items-center">
            <Image
              src="/images/logo_rus4my.webp"
              alt="AirQo"
              width={96}
              height={64}
              priority
              className="h-6 w-auto"
            />
          </Link>

          <span className="hidden h-5 w-px bg-border md:block" aria-hidden="true" />

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
            <a
              href="https://platform.airqo.net/docs/api/for-cities/website-map-integration/"
              target="_blank"
              rel="noopener noreferrer"
            >
              API docs
              <ArrowUpRight />
            </a>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Site navigation links
                </SheetDescription>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1">
                {navItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <SheetClose asChild key={item.name}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block w-full rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {item.name}
                      </Link>
                    </SheetClose>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
