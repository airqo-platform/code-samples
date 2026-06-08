import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin-auth"
import AdminLoginForm from "@/components/admin/AdminLoginForm"

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin")
  return <AdminLoginForm />
}
