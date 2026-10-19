export type BillboardGrid = {
  _id: string; name: string; long_name?: string; admin_level?: string; country?: string; flag_url?: string | null
  sites?: { _id?: string; country?: string }[]
}

export function countryFlagUrl(country: BillboardGrid) {
  const supplied = country.flag_url?.match(/^https:\/\/flagcdn\.com\/(?:w\d+\/)?([a-z]{2})\.(?:png|svg)$/i)?.[1]
  const codes: Record<string, string> = {
    burundi: "bi", cameroon: "cm", "democratic republic of the congo": "cd", "democratic republic of congo": "cd",
    ethiopia: "et", gambia: "gm", ghana: "gh", kenya: "ke", madagascar: "mg", mozambique: "mz",
    nigeria: "ng", rwanda: "rw", senegal: "sn", "south africa": "za", uganda: "ug", zambia: "zm",
  }
  const code = supplied || codes[(country.long_name || country.name).trim().toLowerCase().replace(/_/g, " ")]
  return code ? `https://flagcdn.com/w40/${code.toLowerCase()}.png` : null
}

export function gridsWithinCountry(grids: BillboardGrid[], country: BillboardGrid): BillboardGrid[] {
  const normalize = (name: string) => name.trim().toLowerCase().replace(/_/g, " ")
  const names = new Set([normalize(country.name), normalize(country.long_name || country.name)])
  const countrySites = new Set((country.sites || []).map(site => site._id).filter(Boolean))
  return grids.filter(grid => {
    if (grid._id === country._id || grid.admin_level?.toLowerCase() === "country") return false
    const countries = [grid.country, ...(grid.sites || []).map(site => site.country)].filter((name): name is string => Boolean(name))
    if (countries.length && countries.every(name => names.has(normalize(name)))) return true
    // Site membership also handles alternative country spellings in metadata.
    return Boolean(grid.sites?.length && grid.sites.every(site => site._id && countrySites.has(site._id)))
  })
}

export async function loadBillboardGrids(signal?: AbortSignal): Promise<BillboardGrid[]> {
  const grids = new Map<string, BillboardGrid>()
  let skip = 0
  for (let page = 0; page < 100; page++) {
    // Build local pagination URLs; upstream nextPage links can contain credentials.
    const response = await fetch(`/api/airqo/devices/grids/summary?limit=30&skip=${skip}`, { signal })
    if (!response.ok) throw new Error("Could not load places.")
    const body = await response.json()
    const data = body.data || body
    if (body.success === false || !Array.isArray(data.grids)) throw new Error("Invalid grid response.")
    const rows: BillboardGrid[] = data.grids
    for (const grid of rows) if (grid._id && grid.name) grids.set(grid._id, grid)
    const meta = data.meta || body.meta || {}
    const limit = Number(meta.limit) > 0 ? Number(meta.limit) : 30
    const next = skip + limit
    if (!rows.length || (Number.isFinite(Number(meta.total)) ? next >= Number(meta.total) : rows.length < limit)) {
      return Array.from(grids.values()).sort((a, b) => (a.long_name || a.name).localeCompare(b.long_name || b.name))
    }
    skip = next
  }
  throw new Error("Too many grid pages.")
}
