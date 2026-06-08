import { NextResponse } from "next/server"
import { getSiteSettings } from "@/lib/admin-store"

export async function GET() {
  return NextResponse.json(await getSiteSettings())
}
