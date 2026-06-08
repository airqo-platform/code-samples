import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-auth"
import { addAdmin, listAdmins, type AdminRole } from "@/lib/admin-store"

async function requireSuperAdmin() {
  const session = await getAdminSession()
  return session?.role === "super_admin" ? session : null
}

export async function GET() {
  if (!(await requireSuperAdmin())) return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  return NextResponse.json(await listAdmins())
}

export async function POST(request: Request) {
  if (!(await requireSuperAdmin())) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  try {
    const { email, role } = (await request.json()) as {
      email?: string
      role?: AdminRole
    }
    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedEmail || !normalizedEmail.includes("@") || !["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json(
        { message: "Provide a valid AirQo account email and role." },
        { status: 400 },
      )
    }
    return NextResponse.json(await addAdmin({ email: normalizedEmail, role: role! }), { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to add administrator." }, { status: 400 })
  }
}
