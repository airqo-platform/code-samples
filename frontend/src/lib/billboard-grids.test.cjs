const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
function load(fetch) {
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(`${__dirname}/billboard-grids.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(code, { module, exports: module.exports, Map, fetch })
  return module.exports
}
test('loads later pages containing Kenya, Nairobi and Kisumu without following upstream nextPage URLs', async () => {
  const calls = []
  const { loadBillboardGrids } = load(async url => {
    calls.push(url)
    const second = url.endsWith('skip=30')
    return { ok: true, json: async () => ({ success: true, meta: { total: 33, limit: 30, nextPage: 'https://upstream.invalid/?token=secret' }, grids: second ? ['Kenya','Nairobi','Kisumu'].map(name => ({ _id: name, name })) : Array.from({ length: 30 }, (_, i) => ({ _id: String(i), name: `Place ${i}` })) }) }
  })
  const grids = await loadBillboardGrids()
  assert.equal(grids.length, 33)
  for (const name of ['Kenya','Nairobi','Kisumu']) assert.ok(grids.some(g => g.name === name))
  assert.equal(calls.length, 2)
  assert.ok(calls.every(url => url.startsWith('/api/airqo/') && !url.includes('token')))
})
test('a later page failure is reported instead of silently presenting an incomplete list', async () => {
  let page = 0
  const { loadBillboardGrids } = load(async () => ++page === 2 ? { ok: false } : { ok: true, json: async () => ({ grids: [{ _id: 'a', name: 'A' }], meta: { total: 60, limit: 30 } }) })
  await assert.rejects(loadBillboardGrids(), /Could not load places/)
})

test('country choices narrow grids using metadata and exclude other countries', () => {
  const { gridsWithinCountry } = load(() => {})
  const kenya = { _id: 'ke', name: 'kenya', long_name: 'Kenya', admin_level: 'country', sites: [{ _id: 'n' }, { _id: 'k' }] }
  const grids = [kenya,
    { _id: 'nairobi', name: 'Nairobi', sites: [{ _id: 'n', country: 'Kenya' }] },
    { _id: 'kisumu', name: 'Kisumu', sites: [{ _id: 'k' }] },
    { _id: 'kampala', name: 'Kampala', sites: [{ _id: 'u', country: 'Uganda' }] },
    { _id: 'mixed', name: 'Cross-border', sites: [{ _id: 'n', country: 'Kenya' }, { _id: 'u', country: 'Uganda' }] },
    { _id: 'unknown', name: 'No country metadata' },
  ]
  assert.deepEqual(Array.from(gridsWithinCountry(grids, kenya), g => g._id), ['nairobi', 'kisumu'])
})

test('flags use small trusted images with a fallback for country metadata', () => {
  const { countryFlagUrl } = load(() => {})
  assert.equal(countryFlagUrl({ _id: 'ke', name: 'kenya', flag_url: 'https://flagcdn.com/w320/ke.png' }), 'https://flagcdn.com/w40/ke.png')
  assert.equal(countryFlagUrl({ _id: 'za', name: 'south_africa' }), 'https://flagcdn.com/w40/za.png')
  assert.equal(countryFlagUrl({ _id: 'x', name: 'unknown', flag_url: 'https://untrusted.invalid/image.png' }), null)
})
