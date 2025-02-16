"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Home", href: "/" },
  { name: "Locate", href: "/locate" },
  { name: "Categorize", href: "/categorize" },
  { name: "Reports", href: "/reports" },
  { name: "About", href: "/about" },
]

export default function Navigation({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link href="/" className="text-blue-600 text-xl font-semibold">
          AirQo AI
        </Link>

        <nav className="flex items-center space-x-8" {...props}>
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-sm font-medium text-gray-600 hover:text-gray-900 relative py-2",
                pathname === item.href &&
                  "text-gray-900 after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:bg-blue-600",
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

