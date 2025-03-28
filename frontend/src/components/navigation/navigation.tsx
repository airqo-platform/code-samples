"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Locate", href: "/locate" },
  { name: "Categorize", href: "/categorize" },
  { name: "Reports", href: "/reports" },
  { name: "Pollutants", href: "/pollutants" },
  //{ name: "Poll", href: "/testfetchdata" },
  { name: "About", href: "/about" },
];

export default function Navigation({ ...props }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link href="/" className="text-blue-600 text-xl font-semibold">
          AirQo AI
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-gray-600 hover:text-gray-900"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-8" {...props}>
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-sm font-medium text-gray-600 hover:text-gray-900 relative py-2",
                pathname === item.href &&
                  "text-gray-900 after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:bg-blue-600"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <nav className="lg:hidden bg-white border-t shadow-md">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "block text-base font-medium text-gray-600 hover:text-gray-900",
                  pathname === item.href && "text-gray-900"
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
