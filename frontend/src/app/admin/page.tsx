import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin-auth"
import AdminDashboard from "@/components/admin/AdminDashboard"

export default async function AdminPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")
  return <AdminDashboard session={session} />
}
