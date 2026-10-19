import { unstable_cache } from "next/cache"
import { createHash } from "node:crypto"
import { fetchAirQo } from "@/lib/airqo-server-transport"

export const GRID_CACHE_SECONDS = 3600

type Snapshot = { body: string; status: number; contentType: string }

export class UncachedGridResponse extends Error {
  constructor(public response: Snapshot) {
    super("Grid response is not cacheable")
  }
}

export function isCacheableGridRoute(method: string, path: string) {
  return method === "GET" && /^(devices\/measurements\/grids|predict\/daily-forecasting|spatial\/heatmaps)\/[A-Za-z0-9_-]+$/.test(path)
}

const cachedGridResponse = unstable_cache(async (url: string, _credentialFingerprint: string): Promise<Snapshot> => {
  const response = await fetchAirQo(url, { headers: { Accept: "application/json" } })
  const snapshot = {
    body: await response.text(), status: response.status,
    contentType: response.headers.get("content-type") || "application/json",
  }
  // Throw instead of caching HTTP failures, malformed data, or API-level errors.
  let payload
  try { payload = JSON.parse(snapshot.body) } catch { throw new UncachedGridResponse(snapshot) }
  if (!response.ok || !payload || payload.success === false || payload.error) throw new UncachedGridResponse(snapshot)
  return snapshot
}, ["airqo-server-response-v2"], { revalidate: GRID_CACHE_SECONDS })

// Coalesce simultaneous requests on the same server instance while the shared
// Next.js Data Cache supplies persistence across requests on Vercel.
const pending = new Map<string, Promise<Snapshot>>()

export async function getCachedGridResponse(url: string): Promise<Snapshot> {
  const fingerprint = createHash("sha256").update(process.env.API_TOKEN || "").digest("hex")
  const key = `${url}:${fingerprint}`
  const existing = pending.get(key)
  if (existing) return existing
  const promise = cachedGridResponse(url, fingerprint)
  pending.set(key, promise)
  try { return await promise } finally { pending.delete(key) }
}
