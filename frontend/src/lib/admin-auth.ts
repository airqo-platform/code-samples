import "server-only"

import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { findAdminById, type AdminRole } from "@/lib/admin-store"

const SESSION_COOKIE = "airqo_admin_session"
const SESSION_DURATION_SECONDS = 60 * 60 * 12

export type AdminSession = {
  id: string
  email: string
  role: AdminRole
  expiresAt: number
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured.")
  return secret
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url")
}

export async function createAdminSession(input: Omit<AdminSession, "expiresAt">) {
  const session: AdminSession = {
    ...input,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  }
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url")
  const token = `${payload}.${sign(payload)}`
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  })
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const [payload, signature] = token.split(".")
    if (!payload || !signature) return null

    const expected = Buffer.from(sign(payload))
    const actual = Buffer.from(signature)
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null

    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession
    if (session.expiresAt <= Date.now()) return null

    const admin = await findAdminById(session.id)
    if (!admin?.active) return null
    return { ...session, email: admin.email, role: admin.role }
  } catch {
    return null
  }
}
