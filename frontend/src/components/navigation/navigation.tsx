"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Menu } from "lucide-react"
import Image from "next/image"
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

export default function Navigation({ ...props }) {
  const pathname = usePathname()
  const settings = useSiteSettings()
  const navItems = settings.pages
    .filter((page) => page.enabled)
    .map((page) => ({ name: page.name, href: page.path }))

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" aria-label="AirQo home" className="flex items-center">
          <Image
            src="/images/logo_rus4my.webp"
            alt="AirQo"
            width={96}
            height={64}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-2 lg:flex" {...props}>
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active &&
                    "text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary",
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription className="sr-only">Site navigation links</SheetDescription>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1">
              {navItems.map((item) => {
                const active = pathname === item.href
                return (
                  <SheetClose asChild key={item.name}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                        active && "bg-accent text-accent-foreground",
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
    </header>
  )
}
