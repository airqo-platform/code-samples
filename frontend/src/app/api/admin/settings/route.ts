import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-auth"
import { getSiteSettings, updateSiteSettings } from "@/lib/admin-store"
import { sanitizeSiteSettings } from "@/lib/site-settings"

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await getSiteSettings())
}

export async function PUT(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const settings = sanitizeSiteSettings(await request.json())
  return NextResponse.json(await updateSiteSettings(settings))
}
