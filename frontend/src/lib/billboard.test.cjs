const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
class UncachedGridResponse extends Error {
  constructor(response) { super('upstream unavailable'); this.response = response }
}
function load(path, globals = {}) {
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(`${__dirname}/${path}`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, { module, exports: module.exports, Map, Set, URL, Response, AbortSignal, TextEncoder,
    require: name => { if (name === '@/lib/airqo-api-config') return load('airqo-api-config.ts'); if (name === '@/lib/billboard') return load('billboard.ts'); if (name === '@/lib/api-shared') return { delay: async () => {}, RETRYABLE_API_STATUSES: new Set([429, 500, 502, 503, 504]) }; if (name === '@/lib/airqo-grid-cache') return { UncachedGridResponse, getCachedGridResponse: async url => { const response = await globals.fetch(new URL(url), {}); if (!response.ok) throw new UncachedGridResponse({ status: response.status }); return { body: await response.text(), status: response.status }; } }; throw Error(`Unexpected import: ${name}`) }, ...globals })
  return module.exports
}
test('map coordinates fall back to forecast metadata and preserve zero', () => {
  const { billboardCoordinates } = load('billboard.ts')
  const forecast = { site_details: { site_id: 'a', site_latitude: 0, site_longitude: 32 }, forecasts: [] }
  assert.equal(JSON.stringify(billboardCoordinates({}, forecast)), '[0,32]')
  assert.equal(JSON.stringify(billboardCoordinates({ siteDetails: { latitude: '1.5', longitude: '33' } }, forecast)), '[1.5,33]')
  assert.equal(JSON.stringify(billboardCoordinates({ siteDetails: { latitude: 999, longitude: 33 } }, forecast)), '[0,32]')
  assert.equal(billboardCoordinates({ siteDetails: { latitude: null, longitude: '' } }), null)
})

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
        return Response.json({ measurements: Array.from({ length: second ? 1 : 80 }, () => ({ site_id: 'one-site', time: second ? '2026-10-19T12:00:00Z' : '2026-10-18T12:00:00Z', pm2_5: { value: second ? 15 : 10 }, siteDetails: { approximate_latitude: 0, approximate_longitude: 32, latitude: 1, longitude: 33 }, unused_large_field: 'omit this' })), meta: { total: 81 } })
      }
      if (url.pathname.includes('hourly')) return new Response('', { status: 403 })
      return Response.json([{ success: true, data: [{ forecasts: [] }] }])
    },
  })
  const response = await GET({ nextUrl: new URL('https://example.test/api/billboard?grid_id=gulu') })
  const body = await response.json()
  assert.equal(body.measurements.length, 1)
  assert.equal(body.measurements[0].pm2_5.value, 15)
  assert.equal(body.measurements[0].siteDetails.latitude, 0)
  assert.equal(body.measurements[0].siteDetails.longitude, 32)
  assert.equal(body.measurements[0].unused_large_field, undefined)
  assert.equal(body.warnings.length, 0)
  assert.equal(body.hourly, undefined)
  assert.ok(calls.every(url => url.searchParams.get('token') === null))
  assert.ok(calls.every(url => url.searchParams.get('access_token') === null))
  assert.ok(calls.every(url => url.origin === 'https://platform.airqo.net'))
  assert.equal(calls.some(url => url.pathname.includes('hourly')), false)
})


test('a later measurement page failure preserves readings already loaded', async () => {
  const { GET } = load('../app/api/billboard/route.ts', {
    process: { env: { API_TOKEN: 'test' } },
    fetch: async url => {
      if (url.pathname.includes('measurements')) {
        if (url.searchParams.get('skip') === '80') return new Response('', { status: 503 })
        return Response.json({ measurements: Array.from({ length: 80 }, () => ({ site_id: 'nairobi-site', time: '2026-10-25T12:00:00Z', pm2_5: { value: 18 }, siteDetails: {} })), meta: { total: 160 } })
      }
      return Response.json({ forecasts: [] })
    },
  })
  const response = await GET({ nextUrl: new URL('https://example.test/api/billboard?grid_id=nairobi') })
  const body = await response.json()
  assert.equal(body.measurements.length, 1)
  assert.equal(body.measurements[0].site_id, 'nairobi-site')
  assert.match(body.warnings[0], /Some current readings/)
})

test('a first-page grid failure falls back to map readings using grid site membership', async () => {
  const { GET } = load('../app/api/billboard/route.ts', {
    process: { env: { API_TOKEN: 'test' } },
    fetch: async url => {
      if (url.pathname.includes('/measurements/grids/')) return new Response('', { status: 403 })
      if (url.pathname.endsWith('/devices/grids/summary')) return Response.json({ grids: [{ _id: 'nairobi', sites: [{ _id: 'matching-site' }] }], meta: { total: 1, limit: 30 } })
      if (url.pathname.endsWith('/devices/readings/map')) return Response.json({ measurements: [
        { site_id: 'matching-site', time: '2026-10-25T12:00:00Z', pm2_5: { value: 16 }, siteDetails: {} },
        { site_id: 'other-site', time: '2026-10-25T12:00:00Z', pm2_5: { value: 22 }, siteDetails: {} },
      ] })
      return Response.json({ forecasts: [] })
    },
  })
  const response = await GET({ nextUrl: new URL('https://example.test/api/billboard?grid_id=nairobi') })
  const body = await response.json()
  assert.deepEqual(body.warnings, [])
  assert.equal(body.measurements.length, 1)
  assert.equal(body.measurements[0].site_id, 'matching-site')
  assert.match(response.headers.get('Cache-Control'), /s-maxage=300/)
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
  assert.ok(calls.filter(url => url.pathname.includes('daily-forecasting')).every(url => url.search === ''))
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

for (const status of [401, 403, 503]) {
  test(`forecast HTTP ${status} has accurate warnings, bounded retries and no CDN caching`, async () => {
    let calls = 0
    const { GET } = load('../app/api/billboard/route.ts', {
      process: { env: { API_TOKEN: 'test' } },
      fetch: async url => {
        if (!url.pathname.includes('daily')) return Response.json({ measurements: [] })
        calls++
        return new Response('', { status })
      },
    })
    const response = await GET({ nextUrl: new URL('https://example.test/api/billboard?grid_id=gulu') })
    const body = await response.json()
    assert.equal(calls, status === 503 ? 3 : 1)
    assert.equal(response.headers.get('Cache-Control'), 'no-store, max-age=0')
    assert.match(body.warnings[0], status === 503 ? /temporarily/ : /Daily forecasts unavailable, refresh/)
    assert.doesNotMatch(body.warnings[0], /token|Premium/)
  })
}

test('billboard reuses the unfiltered map forecast collection and keeps measured sites only', async () => {
  const { GET } = load('../app/api/billboard/route.ts', {
    process: { env: { API_TOKEN: 'test' } },
    fetch: async url => {
      if (!url.pathname.includes('daily')) return Response.json({ measurements: [{ site_id: 'matching-site', time: '2026-10-25T12:00:00Z', pm2_5: { value: 12 }, siteDetails: {} }] })
      assert.equal(url.search, '')
      return Response.json({ forecasts: [
        { site_details: { site_id: 'matching-site' }, forecasts: [{ date: '2026-10-26', forecast: { pm2_5_mean: 14 } }] },
        { site_details: { site_id: 'other-site' }, forecasts: [{ date: '2026-10-26', forecast: { pm2_5_mean: 20 } }] },
      ] })
    },
  })
  const response = await GET({ nextUrl: new URL('https://example.test/api/billboard?grid_id=gulu') })
  const body = await response.json()
  assert.deepEqual(body.warnings, [])
  assert.equal(body.daily.length, 1)
  assert.equal(body.daily[0].site_details.site_id, 'matching-site')
  assert.match(response.headers.get('Cache-Control'), /s-maxage=300/)
})
test('a temporary forecast failure recovers on retry', async () => {
  let calls = 0
  const { GET } = load('../app/api/billboard/route.ts', {
    process: { env: { API_TOKEN: 'test' } },
    fetch: async url => {
      if (!url.pathname.includes('daily')) return Response.json({ measurements: [] })
      if (++calls === 1) return new Response('', { status: 503 })
      return Response.json({ forecasts: [] })
    },
  })
  const response = await GET({ nextUrl: new URL('https://example.test/api/billboard?grid_id=gulu') })
  assert.equal(calls, 2)
  assert.deepEqual((await response.json()).warnings, [])
  assert.match(response.headers.get('Cache-Control'), /s-maxage=300/)
})

test('billboard uses the unfiltered map forecast request and retains seven dated days', async () => {
  const { GET } = load('../app/api/billboard/route.ts', {
    process: { env: { API_TOKEN: 'test' } },
    fetch: async url => {
      if (!url.pathname.includes('daily')) return Response.json({ measurements: [{ site_id: 'a', time: '2026-10-25T12:00:00Z', pm2_5: { value: 10 }, siteDetails: {} }] })
      assert.equal(url.search, '')
      return Response.json({ forecasts: [{ site_details: { site_id: 'a' }, forecasts: Array.from({ length: 7 }, (_, i) => ({ date: `2026-10-${25+i}`, forecast: { pm2_5_mean: i === 3 ? null : i } })).reverse() }] })
    },
  })
  const body = await (await GET({ nextUrl: new URL('https://example.test/api/billboard?grid_id=gulu') })).json()
  assert.equal(body.daily[0].forecasts.length, 7)
  assert.equal(body.daily[0].forecasts[0].date, '2026-10-25')
  assert.equal(body.daily[0].forecasts[6].date, '2026-10-31')
  assert.equal(body.daily[0].forecasts[3].forecast.pm2_5_mean, null)
})
