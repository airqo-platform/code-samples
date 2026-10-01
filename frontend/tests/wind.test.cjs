const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")

function load(relative, extra = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", relative), "utf8")
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const context = { exports: {}, Response, URL, URLSearchParams, AbortSignal, process: { env: {} }, ...extra }
  vm.runInNewContext(code, context)
  return context.exports
}
const wind = load("src/lib/wind-field.ts")
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`)
const field = (vectors, bounds = {}) => ({ west: 0, east: 10, south: 0, north: 10, rows: 2, columns: 2, vectors, ...bounds })

test("meteorological FROM directions produce the correct TO vectors", () => {
  for (const [direction, u, v] of [[0, 0, -10], [90, -10, 0], [180, 0, 10], [270, 10, 0]]) {
    const vector = wind.windVector(10, direction)
    close(vector.u, u)
    close(vector.v, v)
  }
})
test("missing data is not silently interpreted as north or calm", () => {
  for (const [speed, direction] of [[null, 0], [5, null], [-1, 90], [Infinity, 0], [5, NaN], [5, 400]]) {
    assert.equal(wind.windVector(speed, direction), null)
  }
  const calm = wind.windVector(0, null)
  assert.equal(calm.u, 0)
  assert.equal(calm.v, 0)
})
test("bilinear interpolation averages components, including around north", () => {
  const grid = field([wind.windVector(10, 350), wind.windVector(10, 10), wind.windVector(10, 350), wind.windVector(10, 10)])
  const centre = wind.sampleWind(grid, 5, 5)
  close(centre.u, 0)
  assert.ok(centre.v < -9.8)
  const opposing = field([wind.windVector(10, 90), wind.windVector(10, 270), wind.windVector(10, 90), wind.windVector(10, 270)])
  close(Math.hypot(...Object.values(wind.sampleWind(opposing, 5, 5))), 0)
})
test("date-line and repeated-world coordinates use the same field", () => {
  const vector = { u: 3, v: 4 }
  const grid = field(Array(4).fill(vector), { west: 170, east: 190 })
  for (const longitude of [-175, 185, 545]) close(wind.sampleWind(grid, 5, longitude).u, 3)
  assert.equal(wind.sampleWind(grid, 5, 160), null)
  assert.equal(wind.wrapLongitude(190), -170)
})
test("holes remain blank, but valid exact edges remain usable", () => {
  const grid = field([{ u: 1, v: 2 }, null, { u: 3, v: 4 }, { u: 5, v: 6 }])
  assert.equal(wind.sampleWind(grid, 5, 5), null)
  close(wind.sampleWind(grid, 0, 0).u, 1)
  close(wind.sampleWind(grid, 10, 10).v, 6)
  assert.equal(wind.sampleWind(grid, 20, 0), null)
})

const route = (fetch) => load("src/app/api/wind/route.ts", { fetch, require: () => wind })
const request = (query = "west=0&east=20&south=-10&north=10") => ({ nextUrl: new URL(`http://localhost/api/wind?${query}`) })
const mockData = () => Array.from({ length: 117 }, () => ({
  current: { time: Math.floor(Date.now() / 900000) * 900, wind_speed_10m: 5, wind_direction_10m: 90 },
  current_units: { wind_speed_10m: "m/s" },
}))

test("API rejects invalid or unbounded input before contacting the provider", async () => {
  const api = route(() => { throw new Error("must not fetch") })
  for (const query of ["", "west=0&east=Infinity&south=0&north=10", "west=0&east=361&south=0&north=10", "west=0&east=10&south=20&north=10", "west=0&east=10&south=-90&north=10"]) {
    assert.equal((await api.GET(request(query))).status, 400)
  }
})
test("API creates a bounded grid, caches it and deduplicates concurrent requests", async () => {
  let calls = 0
  const api = route(async (url) => {
    calls++
    assert.equal(url.hostname, "api.open-meteo.com")
    assert.equal(url.searchParams.get("latitude").split(",").length, 117)
    return Response.json(mockData())
  })
  const responses = await Promise.all([api.GET(request()), api.GET(request())])
  const data = await responses[0].json()
  assert.equal(data.vectors.length, 117)
  assert.equal(data.columns, 13)
  close(data.vectors[0].u, -5)
  assert.equal((await api.GET(request())).status, 200)
  assert.equal(calls, 1)
})
test("API fails visibly for upstream errors, incomplete grids and stale forecasts", async () => {
  const old = mockData()
  old.forEach((entry) => { entry.current.time -= 86400 })
  for (const response of [new Response("Unavailable", { status: 429 }), Response.json([]), Response.json(old)]) {
    const api = route(async () => response)
    assert.equal((await api.GET(request())).status, 502)
  }
})
