import type React from "react"
import { Suspense } from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "@/styles/globals.css"
import GoogleAnalytics from "@/components/GoogleAnalytics"
import { Toaster } from "@/components/ui/toaster"

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

export const metadata: Metadata = {
  title: "AirQo Platform",
  description: "Air quality monitoring and forecasting tool",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

