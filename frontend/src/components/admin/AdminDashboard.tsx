"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  EyeOff,
  LayoutDashboard,
  LogOut,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react"
import type { AdminSession } from "@/lib/admin-auth"
import type { AdminRole } from "@/lib/admin-store"
import type { ManagedPage, SiteSettings } from "@/lib/site-settings"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Switch } from "@/ui/switch"

type PublicAdmin = {
  id: string
  email: string
  role: AdminRole
  active: boolean
  createdAt: string
}

type Message = {
  type: "success" | "error"
  text: string
}

export default function AdminDashboard({ session }: { session: AdminSession }) {
  const router = useRouter()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [publishedSettings, setPublishedSettings] = useState("")
  const [admins, setAdmins] = useState<PublicAdmin[]>([])
  const [pageName, setPageName] = useState("")
  const [pagePath, setPagePath] = useState("")
  const [newAdmin, setNewAdmin] = useState({ email: "", role: "admin" as AdminRole })
  const [message, setMessage] = useState<Message | null>(null)
  const [saving, setSaving] = useState(false)
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [updatingAdminId, setUpdatingAdminId] = useState<string | null>(null)

  async function loadData() {
    try {
      const settingsResponse = await fetch("/api/admin/settings", { cache: "no-store" })
      if (settingsResponse.status === 401) {
        router.push("/admin/login")
        return
      }
      if (!settingsResponse.ok) throw new Error("Unable to load site settings.")

      const loadedSettings = (await settingsResponse.json()) as SiteSettings
      setSettings(loadedSettings)
      setPublishedSettings(JSON.stringify(loadedSettings))

      if (session.role === "super_admin") {
        const adminsResponse = await fetch("/api/admin/users", { cache: "no-store" })
        if (!adminsResponse.ok) throw new Error("Unable to load administrators.")
        setAdmins(await adminsResponse.json())
      }
    } catch (error) {
      console.error("Failed to load admin data:", error)
      setMessage({ type: "error", text: "Unable to load admin data. Please try again." })
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const hasUnsavedChanges = settings ? JSON.stringify(settings) !== publishedSettings : false
  const visiblePages = settings?.pages.filter((page) => page.enabled).length ?? 0
  const enabledFeatures = settings?.features.filter((feature) => feature.enabled).length ?? 0
  const activeAdmins = admins.filter((admin) => admin.active).length

  function updatePage(id: string, changes: Partial<ManagedPage>) {
    setSettings((current) =>
      current ? { ...current, pages: current.pages.map((page) => (page.id === id ? { ...page, ...changes } : page)) } : current,
    )
  }

  function movePage(index: number, direction: -1 | 1) {
    if (!settings) return
    const destination = index + direction
    if (destination < 0 || destination >= settings.pages.length) return

    const pages = [...settings.pages]
    ;[pages[index], pages[destination]] = [pages[destination], pages[index]]
    setSettings({ ...settings, pages })
  }

  function addPage(event: FormEvent) {
    event.preventDefault()
    if (!settings || !pageName.trim() || !pagePath.trim()) return
    const normalizedPath = `/${pagePath.trim().replace(/^\/+|\/+$/g, "")}`
    if (settings.pages.some((page) => page.path.toLowerCase() === normalizedPath.toLowerCase())) {
      setMessage({ type: "error", text: `A page with the path ${normalizedPath} already exists.` })
      return
    }

    setSettings({
      ...settings,
      pages: [
        ...settings.pages,
        {
          id: `${pageName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
          name: pageName.trim(),
          path: normalizedPath,
          enabled: true,
        },
      ],
    })
    setPageName("")
    setPagePath("")
    setMessage(null)
  }

  function validateSettings() {
    if (!settings) return "Site settings have not loaded."

    const paths = new Set<string>()
    for (const page of settings.pages) {
      const name = page.name.trim()
      const path = page.path.trim()
      if (!name || !path) return "Every page must have a name and path."
      if (!path.startsWith("/") || path.includes("?") || path.includes("#")) {
        return `${name} must use a path such as /reports without a query string or hash.`
      }

      const normalizedPath = path.toLowerCase().replace(/\/+$/, "") || "/"
      if (paths.has(normalizedPath)) return `The path ${path} is used more than once.`
      paths.add(normalizedPath)
    }

    return null
  }

  async function saveSettings() {
    if (!settings) return
    const validationError = validateSettings()
    if (validationError) {
      setMessage({ type: "error", text: validationError })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.message || "Unable to publish changes.")

      setSettings(data)
      setPublishedSettings(JSON.stringify(data))
      setMessage({ type: "success", text: "Changes published successfully." })
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to publish changes." })
    } finally {
      setSaving(false)
    }
  }

  async function addAdministrator(event: FormEvent) {
    event.preventDefault()
    setAddingAdmin(true)
    setMessage(null)
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Unable to add administrator.")

      setAdmins((current) => [...current, data])
      setNewAdmin({ email: "", role: "admin" })
      setMessage({ type: "success", text: "Administrator added." })
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to add administrator." })
    } finally {
      setAddingAdmin(false)
    }
  }

  async function patchAdministrator(id: string, changes: Partial<Pick<PublicAdmin, "active" | "role">>) {
    setUpdatingAdminId(id)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Unable to update administrator.")

      setAdmins((current) => current.map((admin) => (admin.id === id ? data : admin)))
      setMessage({ type: "success", text: "Administrator updated." })
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to update administrator." })
    } finally {
      setUpdatingAdminId(null)
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  if (!settings) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">Loading admin controls...</div>
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2"><LayoutDashboard className="h-5 w-5" /></div>
            <div>
              <h1 className="font-semibold">AirQo AI Admin</h1>
              <p className="text-xs text-slate-400">{session.email} · {session.role.replace("_", " ")}</p>
            </div>
          </div>
          <Button onClick={logout} variant="ghost" className="rounded-xl text-white hover:bg-slate-800 hover:text-white">
            <LogOut /> Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8">
        <section className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-600 p-7 text-white sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-100">Website controls</p>
            <h2 className="mt-1 text-2xl font-semibold">Choose what visitors can see and use</h2>
          </div>
          <Button
            onClick={saveSettings}
            disabled={saving || !hasUnsavedChanges}
            className="rounded-xl bg-white text-blue-800 hover:bg-blue-50"
          >
            <Save /> {saving ? "Publishing..." : hasUnsavedChanges ? "Publish changes" : "All changes published"}
          </Button>
        </section>

        {message && (
          <div
            role={message.type === "error" ? "alert" : "status"}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              message.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {message.type === "error" ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            {message.text}
          </div>
        )}

        <section className={`grid gap-4 ${session.role === "super_admin" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Visible pages</p>
            <p className="mt-2 text-3xl font-semibold">
              {visiblePages}<span className="text-base font-normal text-slate-400"> / {settings.pages.length}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Enabled map features</p>
            <p className="mt-2 text-3xl font-semibold">
              {enabledFeatures}<span className="text-base font-normal text-slate-400"> / {settings.features.length}</span>
            </p>
          </div>
          {session.role === "super_admin" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Active administrators</p>
              <p className="mt-2 text-3xl font-semibold">
                {activeAdmins}<span className="text-base font-normal text-slate-400"> / {admins.length}</span>
              </p>
            </div>
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Settings2 className="text-blue-700" />
              <div>
                <h2 className="text-lg font-semibold">Pages</h2>
                <p className="text-sm text-slate-500">Add navigation links or hide existing pages.</p>
              </div>
            </div>

            <div className="space-y-3">
              {settings.pages.map((page, index) => {
                const isHome = page.id === "home" || page.path === "/"
                return (
                  <div key={page.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-[auto_1fr_1fr_auto_auto] sm:items-center">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => movePage(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${page.name} up`}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => movePage(index, 1)}
                        disabled={index === settings.pages.length - 1}
                        aria-label={`Move ${page.name} down`}
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                    <Input value={page.name} onChange={(event) => updatePage(page.id, { name: event.target.value })} aria-label="Page name" className="h-11 rounded-xl border-slate-300 bg-white" />
                    <Input value={page.path} onChange={(event) => updatePage(page.id, { path: event.target.value })} aria-label="Page path" disabled={isHome} className="h-11 rounded-xl border-slate-300 bg-white" />
                    <button
                      type="button"
                      onClick={() => updatePage(page.id, { enabled: !page.enabled })}
                      disabled={isHome}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                        page.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {page.enabled ? <Eye /> : <EyeOff />} {page.enabled ? "Visible" : "Hidden"}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSettings({ ...settings, pages: settings.pages.filter((item) => item.id !== page.id) })}
                      aria-label={`Remove ${page.name}`}
                      disabled={isHome}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )
              })}
            </div>

            <form onSubmit={addPage} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto]">
              <Input placeholder="Page name" value={pageName} onChange={(event) => setPageName(event.target.value)} required className="h-11 rounded-xl border-slate-300 bg-white" />
              <Input placeholder="/page-path" value={pagePath} onChange={(event) => setPagePath(event.target.value)} required className="h-11 rounded-xl border-slate-300 bg-white" />
              <Button type="submit" className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"><Plus /> Add page</Button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <ShieldCheck className="text-cyan-700" />
              <div>
                <h2 className="text-lg font-semibold">Map features</h2>
                <p className="text-sm text-slate-500">Disable unstable or unavailable tools.</p>
              </div>
            </div>
            <div className="space-y-4">
              {settings.features.map((feature) => (
                <div key={feature.id} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div>
                    <h3 className="font-medium">{feature.name}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{feature.description}</p>
                  </div>
                  <Switch
                    checked={feature.enabled}
                    onCheckedChange={(enabled) =>
                      setSettings({
                        ...settings,
                        features: settings.features.map((item) => (item.id === feature.id ? { ...item, enabled } : item)),
                      })
                    }
                    aria-label={`Toggle ${feature.name}`}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {session.role === "super_admin" && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Users className="text-violet-700" />
              <div>
                <h2 className="text-lg font-semibold">Administrator permissions</h2>
                <p className="text-sm text-slate-500">Grant dashboard access and choose who can manage other admins.</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{admin.email}</p>
                      <p className="text-xs text-slate-500">Added {new Date(admin.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={admin.role}
                        onChange={(event) => patchAdministrator(admin.id, { role: event.target.value as AdminRole })}
                        className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                        disabled={admin.id === session.id || updatingAdminId === admin.id}
                      >
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super admin</option>
                      </select>
                      <Switch
                        checked={admin.active}
                        onCheckedChange={(active) => patchAdministrator(admin.id, { active })}
                        disabled={admin.id === session.id || updatingAdminId === admin.id}
                        aria-label={`Toggle ${admin.email}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={addAdministrator} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="font-medium">Add administrator</h3>
                <Input
                  type="email"
                  placeholder="AirQo account email"
                  value={newAdmin.email}
                  onChange={(event) => setNewAdmin({ ...newAdmin, email: event.target.value })}
                  required
                  className="h-11 rounded-xl border-slate-300 bg-white"
                />
                <select
                  value={newAdmin.role}
                  onChange={(event) => setNewAdmin({ ...newAdmin, role: event.target.value as AdminRole })}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="admin">Admin: manage site controls</option>
                  <option value="super_admin">Super admin: also manage admins</option>
                </select>
                <Button type="submit" disabled={addingAdmin} className="w-full rounded-xl bg-violet-700 text-white hover:bg-violet-800">
                  <Plus /> {addingAdmin ? "Granting access..." : "Grant access"}
                </Button>
              </form>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
