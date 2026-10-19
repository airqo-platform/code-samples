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
const temperature = load("src/lib/temperature-field.ts")
const wind = load("src/lib/wind-field.ts")
const field = (temperatures, bounds = {}) => ({ west: 0, east: 10, south: 0, north: 10, rows: 2, columns: 2, temperatures, times: [], ...bounds })

test("temperature interpolation preserves negative values and zero", () => {
  const grid = field([[-10, 0, 0, 10]])
  assert.equal(temperature.sampleTemperature(grid, 0, 5, 5), 0)
  assert.equal(temperature.sampleTemperature(grid, 0, 0, 0), -10)
  assert.equal(temperature.sampleTemperature(grid, 0, 0, 10), 0)
})
test("selected forecast hour determines the map reading", () => {
  const grid = field([[20, 20, 20, 20], [30, 30, 30, 30]])
  assert.equal(temperature.sampleTemperature(grid, 0, 5, 5), 20)
  assert.equal(temperature.sampleTemperature(grid, 1, 5, 5), 30)
  assert.equal(temperature.sampleTemperature(grid, 2, 5, 5), null)
})
test("temperature handles the date line, missing cells and map boundaries", () => {
  const grid = field([[10, 20, 30, 40]], { west: 170, east: 190 })
  assert.equal(temperature.sampleTemperature(grid, 0, 5, -180), 25)
  assert.equal(temperature.sampleTemperature(grid, 0, 5, 540), 25)
  assert.equal(temperature.sampleTemperature(grid, 0, 20, 180), null)
  assert.equal(temperature.sampleTemperature(grid, 0, NaN, 180), null)
  const gap = field([[10, null, 30, 40]])
  assert.equal(temperature.sampleTemperature(gap, 0, 5, 5), null)
  assert.equal(temperature.sampleTemperature(gap, 0, 0, 0), 10)
})
test("one scale covers every hour and does not exaggerate a flat forecast", () => {
  const scale = temperature.temperatureScale(field([[18, 19, null, 20], [27, 28, 29, 30]]))
  assert.deepEqual(Array.from(scale), [15, 30])
  assert.deepEqual(Array.from(temperature.temperatureScale(field([[22, 22, 22, 22]]))), [20, 30])
  assert.deepEqual(Array.from(temperature.temperatureColor(0, scale)), Array.from(temperature.TEMPERATURE_COLORS[0]))
  assert.deepEqual(Array.from(temperature.temperatureColor(100, scale)), Array.from(temperature.TEMPERATURE_COLORS.at(-1)))
})

const request = (query = "west=0&east=20&south=-10&north=10") => ({ nextUrl: new URL(`http://localhost/api/temperature?${query}`) })
const mockData = () => Array.from({ length: 117 }, () => ({
  hourly: {
    time: Array.from({ length: 24 }, (_, i) => Math.floor(Date.now() / 3600000) * 3600 + i * 3600),
    temperature_2m: Array.from({ length: 24 }, (_, i) => 10 + i),
  },
  hourly_units: { temperature_2m: "°C" },
}))
const route = (fetch, env = {}) => load("src/app/api/temperature/route.ts", { fetch, require: () => wind, process: { env } })

test("invalid viewport requests never reach the provider", async () => {
  const api = route(() => { throw new Error("must not fetch") })
  for (const query of ["", "west=&east=10&south=0&north=10", "west=0&east=361&south=0&north=10", "west=0&east=10&south=20&north=10", "west=0&east=10&south=-90&north=10"]) {
    assert.equal((await api.GET(request(query))).status, 400)
  }
})
test("API returns 24 aligned Celsius grids and deduplicates/caches requests", async () => {
  let calls = 0
  const api = route(async (url) => {
    calls++
    assert.equal(url.searchParams.get("hourly"), "temperature_2m")
    assert.equal(url.searchParams.get("forecast_hours"), "24")
    assert.equal(url.searchParams.get("latitude").split(",").length, 117)
    return Response.json(mockData())
  })
  const results = await Promise.all([api.GET(request()), api.GET(request())])
  const result = await results[0].json()
  assert.equal(result.times.length, 24)
  assert.equal(result.temperatures.length, 24)
  assert.equal(result.temperatures[0].length, 117)
  assert.equal(result.temperatures[23][0], 33)
  assert.equal((await api.GET(request())).status, 200)
  assert.equal(calls, 1)
})
test("API rejects stale, partial and unavailable forecasts", async () => {
  const stale = mockData()
  stale.forEach((entry) => { entry.hourly.time = entry.hourly.time.map((time) => time - 86400) })
  for (const response of [new Response("Unavailable", { status: 503 }), Response.json([]), Response.json(stale)]) {
    const api = route(async () => response)
    assert.equal((await api.GET(request())).status, 502)
  }
})

test("provider rate limits trigger a cooldown instead of repeated upstream requests", async () => {
  let calls = 0
  const api = route(async () => { calls++; return new Response("Busy", { status: 429, headers: { "Retry-After": "60" } }) })
  const first = await api.GET(request())
  assert.equal(first.status, 429)
  assert.ok(Number(first.headers.get("retry-after")) > 0)
  assert.equal((await api.GET(request())).status, 429)
  assert.equal(calls, 1)
})
test("mismatched timestamps and missing values remain gaps, not fake temperatures", async () => {
  const data = mockData()
  data[1].hourly.temperature_2m[0] = null
  data[2].hourly.time[0] -= 3600
  data[3].hourly_units.temperature_2m = "°F"
  data[4].hourly.temperature_2m[0] = 0
  const api = route(async () => Response.json(data))
  const result = await (await api.GET(request())).json()
  assert.deepEqual(result.temperatures[0].slice(0, 5), [10, null, null, null, 0])
})

test("hourly quota errors wait until the next hour, not just one minute", async () => {
  const now = Date.now()
  const api = route(async () => Response.json({ reason: "Hourly API request limit exceeded. Please try again in the next hour." }, { status: 429 }))
  const response = await api.GET(request())
  assert.equal(response.status, 429)
  const expected = Math.ceil((((Math.floor(now / 3600000) + 1) * 3600000) - now) / 1000)
  assert.ok(Math.abs(Number(response.headers.get("retry-after")) - expected) <= 2)
})
