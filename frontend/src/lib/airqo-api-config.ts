// Shared by the site's API proxy and server-side billboard requests.
export const AIRQO_API_URL = "https://platform.airqo.net/api/v2/"

export function unwrapForecastPayload(value: any): any {
  let current = value
  for (let i = 0; i < 6; i++) {
    if (Array.isArray(current) && current.length === 1) current = current[0]
    else break
  }
  return current
}
