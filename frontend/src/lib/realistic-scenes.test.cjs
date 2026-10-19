const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const moduleUnderTest = { exports: {} }
const code = ts.transpileModule(fs.readFileSync(`${__dirname}/realistic-scenes.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
vm.runInNewContext(code, { module: moduleUnderTest, exports: moduleUnderTest.exports })
const { sceneCategory, scenesForCategory, shuffledScenes } = moduleUnderTest.exports

test('every AQI category has five distinct scene assets and motion styles', () => {
  for (const category of ['good','moderate','sensitive','unhealthy','very','hazardous']) {
    const scenes = scenesForCategory(category)
    assert.equal(scenes.length, 5)
    assert.equal(new Set(scenes.map(s => s.src)).size, 5)
    assert.equal(new Set(scenes.map(s => s.motion)).size, 5)
    assert.ok(scenes.every(s => s.category === category))
  }
})
test('polluted air never selects the outdoor sports category', () => {
  assert.equal(sceneCategory(0), 'good')
  assert.equal(sceneCategory(9.1), 'good')
  assert.equal(sceneCategory(10), 'moderate')
  assert.equal(sceneCategory(40), 'sensitive')
  assert.equal(sceneCategory(60), 'unhealthy')
  assert.equal(sceneCategory(150), 'very')
  assert.equal(sceneCategory(250), 'hazardous')
  assert.equal(sceneCategory(null), null)
})
test('shuffle cycles include all five scenes and avoid a boundary repeat', () => {
  for (let previous = 0; previous < 5; previous++) {
    const bag = shuffledScenes(previous)
    assert.deepEqual(Array.from(bag).sort(), [0,1,2,3,4])
    assert.notEqual(bag[0], previous)
  }
})

test('all production images exist and stay within the character asset budget', async () => {
  const path = require('node:path')
  const sharp = require('sharp')
  let total = 0
  for (const category of ['good','moderate','sensitive','unhealthy','very','hazardous']) for (const scene of scenesForCategory(category)) {
    const file = path.resolve(__dirname, '../../public', scene.src.slice(1))
    total += fs.statSync(file).size
    const metadata = await sharp(file).metadata()
    assert.equal(metadata.hasAlpha, true)
    assert.ok(metadata.width <= 360 && metadata.height <= 360)
  }
  assert.ok(total < 750000, `Character artwork is too large: ${total} bytes`)
})

test('every action is an eight-frame transparent sequence with changing poses', async () => {
  const path = require('node:path')
  const { createHash } = require('node:crypto')
  const sharp = require('sharp')
  for (const category of ['good','moderate','sensitive','unhealthy','very','hazardous']) for (const scene of scenesForCategory(category)) {
    const file = path.resolve(__dirname, '../../public', scene.actionSrc.slice(1))
    const metadata = await sharp(file).metadata()
    assert.equal(metadata.width, 1536)
    assert.equal(metadata.height, 256)
    assert.equal(metadata.hasAlpha, true)
    assert.ok(fs.statSync(file).size < 250000)
    const poses = new Set()
    for (let frame=0; frame<8; frame++) {
      const pixels = await sharp(file).extract({ left: frame*192, top: 0, width: 192, height: 256 }).raw().toBuffer()
      poses.add(createHash('sha256').update(pixels).digest('hex'))
    }
    assert.ok(poses.size >= 4, `${scene.title} must contain changing action poses`)
    assert.ok(scene.duration >= 800)
  }
})
