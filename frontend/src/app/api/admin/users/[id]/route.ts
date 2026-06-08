import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-auth"
import { updateAdmin, type AdminRole } from "@/lib/admin-store"

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (session?.role !== "super_admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const { id } = await context.params
  const changes = (await request.json()) as { role?: AdminRole; active?: boolean }
  if (id === session.id && changes.active === false) {
    return NextResponse.json({ message: "You cannot disable your own account." }, { status: 400 })
  }

  try {
    return NextResponse.json(await updateAdmin(id, changes))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to update administrator." }, { status: 400 })
  }
}
