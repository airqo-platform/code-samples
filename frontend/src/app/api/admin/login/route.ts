import { NextResponse } from "next/server"
import { createAdminSession } from "@/lib/admin-auth"
import { findAdminByEmail } from "@/lib/admin-store"

const AIRQO_LOGIN_URL = "https://api.airqo.net/api/v2/users/login-enhanced?tenant=airqo"

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as { email?: string; password?: string }
    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 })
    }

    const airqoResponse = await fetch(AIRQO_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
      cache: "no-store",
    })
    const airqoData = await airqoResponse.json().catch(() => null)

    if (!airqoResponse.ok || airqoData?.success === false) {
      return NextResponse.json(
        { message: airqoData?.message || "Invalid AirQo email or password." },
        { status: airqoResponse.status === 400 ? 401 : airqoResponse.status },
      )
    }

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
    console.error("Admin login failed:", error)
    return NextResponse.json(
      { message: "Unable to reach the AirQo authentication service." },
      { status: 502 },
    )
  }
}
