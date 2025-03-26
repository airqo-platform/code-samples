"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Menu, X } from "lucide-react"

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">AirQo</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>HOME</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/map" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>MAP</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/locate" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>Locate</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/categorize" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>Categorize</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/reports" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>Reports</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/about" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>About</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden ml-auto">
          <Button variant="ghost" size="icon" aria-label="Toggle Menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex md:items-center md:justify-end md:space-x-4">
          <Button asChild variant="outline">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="flex flex-col space-y-3 p-4 border-t">
            <Link href="/" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>
              HOME
            </Link>
            <Link href="/map" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>
              MAP
            </Link>
            <Link href="/locate" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>
              Locate
            </Link>
            <Link href="/categorize" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>
              Categorize
            </Link>
            <Link href="/reports" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>
              Reports
            </Link>
            <Link href="/about" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>
              About
            </Link>
            <div className="pt-4 flex flex-col space-y-3">
              <Button asChild variant="outline">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

