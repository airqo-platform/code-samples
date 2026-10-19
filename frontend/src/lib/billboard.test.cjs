const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
function load(path, globals = {}) {
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(`${__dirname}/${path}`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, { module, exports: module.exports, Map, Set, URL, Response, AbortSignal, TextEncoder,
    require: name => { if (name === '@/lib/airqo-api-config') return load('airqo-api-config.ts'); if (name === '@/lib/billboard') return load('billboard.ts'); if (name === '@/lib/airqo-grid-cache') return { getCachedGridResponse: async url => { const response = await globals.fetch(new URL(url), {}); if (!response.ok) throw Error('upstream unavailable'); return { body: await response.text(), status: response.status }; } }; throw Error(`Unexpected import: ${name}`) }, ...globals })
  return module.exports
}
test('unknown pollution values are never classified as good air', () => {
  const { category } = load('billboard.ts')
  for (const n of [null, undefined, NaN, -1]) assert.equal(category(n).label, 'Unavailable')
  assert.equal(category(9.1).label, 'Good')
  assert.equal(category(35.5).label, 'Unhealthy for sensitive groups')
})

test('PM2.5 visibility preserves zero and rejects unavailable or invalid values', () => {
  const { hasPm25 } = load('billboard.ts')
  assert.equal(hasPm25(0), true)
  assert.equal(hasPm25(12.5), true)
  for (const value of [null, undefined, NaN, Infinity, -1, '', '12.5']) assert.equal(hasPm25(value), false)
})

test('scan links preserve only the scope and use the public site for localhost previews', () => {
  const { billboardScanUrl } = load('billboard.ts')
  const local = new URL(billboardScanUrl('http://localhost:3000', 'grid', 'gulu-grid'))
  assert.equal(local.origin, 'https://ai.airqo.net')
  assert.equal(local.pathname, '/billboard')
  assert.equal(local.searchParams.get('grid_id'), 'gulu-grid')
  const deployed = new URL(billboardScanUrl('https://ai.airqo.net/billboard?token=secret&site_id=rotating-site&theme=light', 'cohort', 'network-id'))
  assert.equal(deployed.search, '?cohort_id=network-id')
  assert.equal(deployed.searchParams.has('token'), false)
  assert.equal(deployed.searchParams.has('site_id'), false)
})
test('latest reading per location wins regardless of response order', () => {
  const { latestReadings } = load('billboard.ts')
  const rows = [{ site_id: 'a', time: '2026-10-19T12:00:00Z' }, { site_id: 'a', time: '2026-10-18T12:00:00Z' }, { site_id: 'b', time: 'invalid' }]
  const result = latestReadings(rows)
  assert.equal(result.size, 1)
  assert.equal(result.get('a').time, rows[0].time)
})
test('ambiguous scopes are rejected before contacting AirQo', async () => {
  let calls = 0
  const { GET } = load('../app/api/billboard/route.ts', { process: { env: { API_TOKEN: 'test' } }, fetch: () => { calls++; throw Error('unexpected') } })
  const request = query => ({ nextUrl: new URL(`https://example.test/api/billboard?${query}`) })
  assert.equal((await GET(request('grid_id=a&cohort_id=b'))).status, 400)
  assert.equal(calls, 0)
})
test('default load fetches weekly data only and compacts readings without credentials in URLs', async () => {
  const calls = []
  const { GET } = load('../app/api/billboard/route.ts', {
    process: { env: { API_TOKEN: 'test' } },
    fetch: async (url, options) => {
      calls.push(url)
      if (url.pathname.includes('measurements')) {
        const second = url.searchParams.get('skip') === '80'
        return Response.json({ measurements: Array.from({ length: second ? 1 : 80 }, () => ({ site_id: 'one-site', time: second ? '2026-10-19T12:00:00Z' : '2026-10-18T12:00:00Z', pm2_5: { value: second ? 15 : 10 }, unused_large_field: 'omit this' })), meta: { total: 81 } })
      }
      if (url.pathname.includes('hourly')) return new Response('', { status: 403 })
      return Response.json([{ success: true, data: [{ forecasts: [] }] }])
    },
  })
  const response = await GET({ nextUrl: new URL('https://example.test/api/billboard?grid_id=gulu') })
  const body = await response.json()
  assert.equal(body.measurements.length, 1)
  assert.equal(body.measurements[0].pm2_5.value, 15)
  assert.equal(body.measurements[0].unused_large_field, undefined)
  assert.equal(body.warnings.length, 0)
  assert.equal(body.hourly.length, 0)
  assert.ok(calls.every(url => url.searchParams.get('token') === null))
  assert.ok(calls.every(url => url.searchParams.get('access_token') === null))
  assert.ok(calls.every(url => url.origin === 'https://platform.airqo.net'))
  assert.equal(calls.some(url => url.pathname.includes('hourly')), false)
})

test('hourly data is requested explicitly and returns only the chosen location', async () => {
  const calls = []
  const { GET } = load('../app/api/billboard/route.ts', {
    process: { env: { API_TOKEN: 'test' } },
    fetch: async url => {
      calls.push(url)
      return Response.json({ data: { forecasts: ['a','b'].map(site_id => ({ site_details: { site_id, site_name: site_id }, forecasts: Array.from({ length: 168 }, (_, i) => ({ timestamp: new Date(Math.floor(Date.now() / 3600000) * 3600000 + (i - 4) * 3600000).toISOString(), forecast: { pm2_5_mean: 20, unused: 'drop' }, met: null })) })) } })
    },
  })
  const response = await GET({ nextUrl: new URL('https://example.test/api/billboard?grid_id=gulu&hourly=1&site_id=b') })
  const body = await response.json()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].pathname, '/api/v2/predict/hourly-forecasting')
  assert.equal(calls[0].searchParams.get('hours'), '168')
  assert.equal(body.hourly.length, 1)
  assert.equal(body.hourly[0].site_details.site_id, 'b')
  assert.equal(body.hourly[0].forecasts.length, 24)
  assert.ok(Date.parse(body.hourly[0].forecasts[0].timestamp) >= Math.floor(Date.now() / 3600000) * 3600000)
  assert.equal(body.hourly[0].forecasts[0].forecast.unused, undefined)
})

test('daily forecast failures do not hide available readings', async () => {
  const { GET } = load('../app/api/billboard/route.ts', {
    process: { env: { API_TOKEN: 'test' } },
    fetch: async url => url.pathname.includes('daily') ? new Response('', { status: 503 }) : Response.json({ measurements: [{ site_id: 'a', time: '2026-10-19T12:00:00Z', pm2_5: { value: 20 } }] }),
  })
  const body = await (await GET({ nextUrl: new URL('https://example.test/api/billboard?grid_id=gulu') })).json()
  assert.equal(body.measurements.length, 1)
  assert.match(body.warnings[0], /Daily/)
})


test('any valid cohort ID is forwarded without a local allowlist', async () => {
  const calls = []
  const { GET } = load('../app/api/billboard/route.ts', { process: { env: { API_TOKEN: 'test' } }, fetch: async url => {
    calls.push(url)
    return Response.json(url.pathname.includes('measurements') ? { measurements: [] } : { forecasts: [] })
  } })
  const result = await GET({ nextUrl: new URL('https://example.test/api/billboard?cohort_id=organisation-network') })
  assert.equal(result.status, 200)
  assert.ok(calls.some(url => url.pathname.endsWith('/cohorts/organisation-network')))
  assert.ok(calls.some(url => url.searchParams.get('cohort_id') === 'organisation-network'))
})

test('activity scenes reserve vigorous sports for good air', () => {
  const { activityForAir } = load('billboard.ts')
  assert.equal(activityForAir(5, 'football'), 'football')
  assert.equal(activityForAir(5, 'running'), 'running')
  assert.equal(activityForAir(5, 'yoga'), 'yoga')
  assert.equal(activityForAir(20, 'football'), 'walking')
  assert.equal(activityForAir(50, 'football'), 'yoga')
  assert.equal(activityForAir(80, 'running'), 'reading')
  assert.equal(activityForAir(180, 'football'), 'resting')
  assert.equal(activityForAir(280, 'football'), 'window')
  assert.equal(activityForAir(null), 'unavailable')
})
