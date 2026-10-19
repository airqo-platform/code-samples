const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const { EventEmitter } = require('node:events')
const ts = require('typescript')
const secret = 'fake-test-secret+value'
function load(request) {
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(`${__dirname}/airqo-server-transport.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(code, { module, exports: module.exports, URL, Headers, Response, Buffer, process: { env: { API_TOKEN: secret } }, require: name => name === 'node:https' ? { request } : { AIRQO_API_URL: 'https://platform.airqo.net/api/v2/' } })
  return module.exports
}
test('token stays out of caller URL objects and is added only to the private HTTPS path', async () => {
  let sent
  const { fetchAirQo } = load((options, callback) => {
    sent = options
    const req = new EventEmitter()
    req.setTimeout = () => {}; req.end = () => {
      const res = new EventEmitter(); res.statusCode = 200; res.headers = { 'content-type': 'application/json' }
      callback(res); res.emit('data', Buffer.from(JSON.stringify({ success: true, reflected: secret }))); res.emit('end')
    }
    return req
  })
  const url = new URL('https://platform.airqo.net/api/v2/predict/daily-forecasting?cohort_id=example')
  const response = await fetchAirQo(url)
  assert.equal(url.searchParams.has('token'), false)
  assert.equal(url.searchParams.has('access_token'), false)
  assert.equal(sent.hostname, 'platform.airqo.net')
  assert.ok(sent.path.includes(`token=${encodeURIComponent(secret)}`))
  assert.equal((await response.json()).reflected, '[REDACTED]')
})
test('request failures discard raw errors and credential-bearing diagnostics', async () => {
  const { fetchAirQo } = load((options) => {
    const req = new EventEmitter(); req.setTimeout = () => {}
    req.end = () => req.emit('error', new Error(`failed ${options.path}`))
    return req
  })
  await assert.rejects(fetchAirQo('https://platform.airqo.net/api/v2/devices/grids/summary'), error => {
    assert.equal(error.message, 'AirQo upstream request failed.')
    assert.equal(error.cause, undefined)
    assert.ok(!String(error.stack).includes(secret))
    return true
  })
})
test('credentials cannot be sent to a different origin', async () => {
  const { fetchAirQo } = load(() => { throw Error('must not send') })
  await assert.rejects(fetchAirQo('https://example.test/'), /Invalid AirQo upstream/)
})

test('oversized upstream responses are stopped before unbounded buffering', async () => {
  let stopped = false
  const { fetchAirQo } = load((options, callback) => {
    const req = new EventEmitter()
    req.setTimeout = () => {}
    req.destroy = () => { stopped = true }
    req.end = () => {
      const res = new EventEmitter()
      res.statusCode = 200; res.headers = {}
      res.destroy = () => { stopped = true }
      callback(res)
      res.emit('data', Buffer.alloc(16 * 1024 * 1024 + 1))
    }
    return req
  })
  await assert.rejects(fetchAirQo('https://platform.airqo.net/api/v2/devices/grids/summary'), /AirQo upstream request failed/)
  assert.equal(stopped, true)
})
