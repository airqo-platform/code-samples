import "server-only"

import { createHash, randomBytes } from "crypto"
import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { defaultSiteSettings, sanitizeSiteSettings, type SiteSettings } from "@/lib/site-settings"

const storePath = path.join(process.cwd(), "data", "admin-store.json")

export type AdminRole = "super_admin" | "admin"

export type AdminUser = {
  id: string
  email: string
  role: AdminRole
  active: boolean
  createdAt: string
}

type AdminStore = {
  settings: SiteSettings
  admins: AdminUser[]
}

const emptyStore: AdminStore = {
  settings: defaultSiteSettings,
  admins: [],
}

async function readStoreFile(): Promise<AdminStore> {
  try {
    const raw = await readFile(storePath, "utf8")
    const parsed = JSON.parse(raw) as Partial<AdminStore>
    return {
      settings: sanitizeSiteSettings(parsed.settings),
      admins: Array.isArray(parsed.admins)
        ? parsed.admins
            .map((admin) => {
              const candidate = admin as AdminUser & { username?: string }
              const email = candidate.email || candidate.username
              return email ? { ...candidate, email } : null
            })
            .filter((admin): admin is AdminUser => Boolean(admin))
        : [],
    }
  } catch {
    return structuredClone(emptyStore)
  }
}

async function writeStoreFile(store: AdminStore) {
  await mkdir(path.dirname(storePath), { recursive: true })
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8")
}

async function ensureBootstrapAdmin(store: AdminStore) {
  if (store.admins.length > 0) return store

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return store

  const nextStore: AdminStore = {
    ...store,
    admins: [
      {
        id: createHash("sha256").update(`bootstrap:${email}`).digest("hex").slice(0, 24),
        email,
        role: "super_admin",
        active: true,
        createdAt: new Date().toISOString(),
      },
    ],
  }
  try {
    await writeStoreFile(nextStore)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (!["EACCES", "EPERM", "EROFS"].includes(code ?? "")) throw error
    console.warn("Admin store is read-only; using the configured bootstrap administrator without persistence.")
  }
  return nextStore
}

export async function getStore() {
  return ensureBootstrapAdmin(await readStoreFile())
}

export async function getSiteSettings() {
  return (await getStore()).settings
}

export async function updateSiteSettings(settings: SiteSettings) {
  const store = await getStore()
  store.settings = sanitizeSiteSettings(settings)
  await writeStoreFile(store)
  return store.settings
}

export async function findAdminByEmail(email: string) {
  const store = await getStore()
  return store.admins.find((admin) => admin.email.toLowerCase() === email.toLowerCase())
}

export async function findAdminById(id: string) {
  const store = await getStore()
  return store.admins.find((admin) => admin.id === id)
}

export async function listAdmins() {
  const store = await getStore()
  return store.admins
}

export async function addAdmin(input: { email: string; role: AdminRole }) {
  const store = await getStore()
  if (store.admins.some((admin) => admin.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("An administrator with that email already exists.")
  }

  const admin: AdminUser = {
    id: randomBytes(12).toString("hex"),
    email: input.email.toLowerCase(),
    role: input.role,
    active: true,
    createdAt: new Date().toISOString(),
  }
  store.admins.push(admin)
  await writeStoreFile(store)
  return admin
}

export async function updateAdmin(
  id: string,
  changes: { role?: AdminRole; active?: boolean },
) {
  const store = await getStore()
  const admin = store.admins.find((candidate) => candidate.id === id)
  if (!admin) throw new Error("Administrator not found.")

  if (changes.role) admin.role = changes.role
  if (typeof changes.active === "boolean") admin.active = changes.active
  await writeStoreFile(store)
  return admin
}
