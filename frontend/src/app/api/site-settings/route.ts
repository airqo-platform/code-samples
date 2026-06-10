import { NextResponse } from "next/server"
import { getSiteSettings } from "@/lib/admin-store"
import { defaultSiteSettings } from "@/lib/site-settings"

export async function GET() {
  try {
    return NextResponse.json(await getSiteSettings())
  } catch (error) {
    console.error("Unable to load public site settings:", error)
    return NextResponse.json(defaultSiteSettings)
  }
}
