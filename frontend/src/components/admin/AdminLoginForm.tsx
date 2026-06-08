"use client"

import { FormEvent, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { LockKeyhole, ShieldCheck } from "lucide-react"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"

export default function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.message || "Unable to sign in.")
        return
      }
      router.push("/admin")
      router.refresh()
    } catch {
      setError("Unable to reach the login service.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 p-12 text-white lg:block">
            <Image src="/images/logo_rus4my.webp" alt="AirQo" width={64} height={64} className="mb-16 rounded-xl bg-white p-2" />
            <ShieldCheck className="mb-6 h-12 w-12 text-cyan-300" />
            <h1 className="max-w-md text-4xl font-semibold leading-tight">Control what visitors can access across AirQo AI.</h1>
            <p className="mt-5 max-w-md text-blue-100">
              Manage public pages, map features, and administrator permissions from one protected workspace.
            </p>
          </section>

          <section className="p-8 sm:p-12">
            <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-semibold">Admin sign in</h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in with an AirQo account that has been granted administrator access.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block text-sm font-medium">
                AirQo email
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 h-12"
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Password
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 h-12"
                  required
                />
              </label>
              {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <Button type="submit" disabled={loading} className="h-12 w-full bg-blue-700 text-white hover:bg-blue-800">
                {loading ? "Signing in with AirQo..." : "Sign in with AirQo"}
              </Button>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}
