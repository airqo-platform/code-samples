const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(fetch) {
  const module = { exports: {} }
  const options = []
  const stored = []
  const code = ts.transpileModule(fs.readFileSync(`${__dirname}/airqo-grid-cache.ts`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, { module, exports: module.exports, fetch, AbortSignal, TextEncoder, process: { env: { API_TOKEN: 'test' } },
    require: name => name === 'node:crypto' ? require('node:crypto') : name === '@/lib/airqo-server-transport' ? { fetchAirQo: fetch } : { unstable_cache: (fn, _key, policy) => { options.push(policy); return async (...args) => { const value = await fn(...args); stored.push(value); return value } } },
  })
  return { api: module.exports, options, stored }
}

test('five-minute policy applies to public cacheable GET routes', () => {
  const { api, options } = load(() => {})
  assert.equal(options[0].revalidate, 300)
  for (const path of ['devices/measurements/grids/a', 'predict/daily-forecasting/a', 'spatial/heatmaps/a']) {
    assert.equal(api.isCacheableGridRoute('GET', path), true)
    assert.equal(api.isCacheableGridRoute('POST', path), false)
  }
  assert.equal(api.isCacheableGridRoute('GET', 'predict/daily-forecasting'), true)
})

test('simultaneous requests share one upstream call', async () => {
  let calls = 0
  let finish
  const { api } = load(async () => {
    calls++
    await new Promise(resolve => { finish = resolve })
    return new Response(JSON.stringify({ success: true, measurements: [] }))
  })
  const first = api.getCachedGridResponse('https://example.test/grid-a')
  const second = api.getCachedGridResponse('https://example.test/grid-a')
  assert.equal(calls, 1)
  finish()
  assert.deepEqual(await first, await second)
})

test('failed responses are thrown out of the cache and can be retried', async () => {
  for (const response of [new Response('unavailable', { status: 503 }), new Response('{"success":false}'), new Response('invalid JSON')]) {
    let calls = 0
    const { api } = load(async () => { calls++; return response.clone() })
    await assert.rejects(api.getCachedGridResponse('https://example.test/grid-a'), api.UncachedGridResponse)
    await assert.rejects(api.getCachedGridResponse('https://example.test/grid-a'), api.UncachedGridResponse)
    assert.equal(calls, 2)
  }
})


test('oversized successful responses bypass storage without failing or refetching', async () => {
  let calls = 0
  const body = JSON.stringify({ success: true, data: '\u00e9'.repeat(1400000) })
  const { api, stored } = load(async () => { calls++; return new Response(body) })
  const [first, second] = await Promise.all([
    api.getCachedGridResponse('https://example.test/forecast'),
    api.getCachedGridResponse('https://example.test/forecast'),
  ])
  assert.equal(first.body, body)
  assert.equal(second.body, body)
  assert.equal(first.status, 200)
  assert.equal(calls, 1)
  assert.equal(stored.length, 0)
})
