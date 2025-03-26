"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import localFont from "next/font/local"
import "@/styles/globals.css"
import GoogleAnalytics from "@/components/GoogleAnalytics"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/hooks/use-auth"

const geistSans = localFont({
  src: "../../public/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "../../public/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Use client-side only rendering to avoid hydration mismatch
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {isClient ? (
          <>
            <Suspense fallback={null}>
              <GoogleAnalytics />
            </Suspense>
            <AuthProvider>{children}</AuthProvider>
            <Toaster />
          </>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </body>
    </html>
  )
}

