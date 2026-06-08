import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-auth"

export async function GET() {
  const session = await getAdminSession()
  return session
    ? NextResponse.json({ authenticated: true, user: session })
    : NextResponse.json({ authenticated: false }, { status: 401 })
}
