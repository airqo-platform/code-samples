import { request } from "node:https"
import { AIRQO_API_URL } from "@/lib/airqo-api-config"

// Do not pass credential-bearing URLs to Next's instrumented fetch/cache/logger.
// AirQo requires query authentication; add it only to the private HTTPS path.
export async function fetchAirQo(input: string | URL, options: {
  method?: string; headers?: HeadersInit; body?: ArrayBuffer; timeoutMs?: number
} = {}, redirects = 0): Promise<Response> {
  const token = process.env.API_TOKEN
  if (!token) throw new Error("AirQo credentials are not configured.")
  const url = new URL(input)
  if (url.origin !== new URL(AIRQO_API_URL).origin || url.protocol !== "https:") throw new Error("Invalid AirQo upstream.")
  url.searchParams.delete("token")
  url.searchParams.delete("access_token")
  const headers = Object.fromEntries(new Headers(options.headers).entries())
  headers["accept-encoding"] = "identity"
  const query = url.search ? `${url.search}&` : "?"
  const privatePath = `${url.pathname}${query}token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`
  return new Promise<Response>((resolve, reject) => {
    const fail = () => reject(new Error("AirQo upstream request failed."))
    const req = request({ protocol: "https:", hostname: url.hostname, port: url.port || undefined,
      path: privatePath, method: options.method || "GET", headers,
    }, response => {
      const status = response.statusCode || 502
      if ([301, 302, 303, 307, 308].includes(status) && response.headers.location) {
        response.resume()
        if (redirects >= 3) return fail()
        const next = new URL(response.headers.location, url)
        void fetchAirQo(next, status === 303 ? { ...options, method: "GET", body: undefined } : options, redirects + 1).then(resolve, fail)
        return
      }
      const chunks: Buffer[] = []
      let bytes = 0
      response.on("data", chunk => {
        bytes += chunk.length
        if (bytes > 16 * 1024 * 1024) { response.destroy(); req.destroy(); fail(); return }
        chunks.push(Buffer.from(chunk))
      })
      response.on("error", fail)
      response.on("end", () => {
        // Never forward a credential echoed by an upstream error response.
        const text = Buffer.concat(chunks).toString("utf8").split(token).join("[REDACTED]").split(encodeURIComponent(token)).join("[REDACTED]")
        resolve(new Response([204, 205, 304].includes(status) ? null : text, {
          status, headers: { "Content-Type": String(response.headers["content-type"] || "application/json") },
        }))
      })
    })
    req.setTimeout(options.timeoutMs || 30000, () => req.destroy(new Error("AirQo timeout")))
    req.on("error", fail)
    if (options.body) req.write(Buffer.from(options.body))
    req.end()
  })
}
