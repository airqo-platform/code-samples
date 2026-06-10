import { NextResponse } from "next/server"
import { createAdminSession } from "@/lib/admin-auth"
import { findAdminByEmail } from "@/lib/admin-store"

const AIRQO_LOGIN_URL = "https://api.airqo.net/api/v2/users/login-enhanced?tenant=airqo"

export async function POST(request: Request) {
  let credentials: { email?: string; password?: string }
  try {
    credentials = (await request.json()) as { email?: string; password?: string }
  } catch {
    return NextResponse.json({ message: "Invalid login request." }, { status: 400 })
  }

  const normalizedEmail = credentials.email?.trim().toLowerCase()
  if (!normalizedEmail || !credentials.password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 })
  }
  if (!process.env.ADMIN_SESSION_SECRET) {
    console.error("Admin login failed: ADMIN_SESSION_SECRET is not configured.")
    return NextResponse.json({ message: "Admin login is not configured on this deployment." }, { status: 500 })
  }

  let airqoResponse: Response
  try {
    airqoResponse = await fetch(AIRQO_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password: credentials.password }),
      cache: "no-store",
    })
  } catch (error) {
    console.error("AirQo authentication request failed:", error)
    return NextResponse.json(
      { message: "Unable to reach the AirQo authentication service." },
      { status: 502 },
    )
  }

  const airqoData = await airqoResponse.json().catch(() => null)
  if (!airqoResponse.ok || airqoData?.success === false) {
    return NextResponse.json(
      { message: airqoData?.message || "Invalid AirQo email or password." },
      { status: airqoResponse.status === 400 ? 401 : airqoResponse.status },
    )
  }

  try {
    const admin = await findAdminByEmail(normalizedEmail)
    if (!admin?.active) {
      return NextResponse.json(
        { message: "Your AirQo account is valid but has not been granted access to this admin page." },
        { status: 403 },
      )
    }

    await createAdminSession({ id: admin.id, email: admin.email, role: admin.role })
    return NextResponse.json({ user: { id: admin.id, email: admin.email, role: admin.role } })
  } catch (error) {
    console.error("Admin session setup failed:", error)
    return NextResponse.json(
      { message: "Admin login could not access its server-side configuration." },
      { status: 500 },
    )
  }
}
