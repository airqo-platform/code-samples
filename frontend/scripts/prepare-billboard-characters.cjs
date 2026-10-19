// Usage: node scripts/prepare-billboard-characters.cjs <good.png> <moderate.png>
//        <sensitive.png> <unhealthy.png> <very.png> <hazardous.png>
// Crops generated atlases along transparent seams, then creates small WebP assets.
const sharp = require('sharp')
const fs = require('node:fs/promises')
const path = require('node:path')
const categories = ['good','moderate','sensitive','unhealthy','very','hazardous']

function seam(data, width, height, boundary) {
  const low = Math.max(1, Math.floor(boundary - width * .115))
  const high = Math.min(width - 1, Math.ceil(boundary + width * .115))
  const span = high - low + 1
  const parents = new Int16Array(span * height)
  let previous = new Float64Array(span)
  for (let y = 0; y < height; y++) {
    const costs = new Float64Array(span)
    for (let i = 0; i < span; i++) {
      let best = i
      for (const candidate of [i-1, i+1]) if (candidate >= 0 && candidate < span && previous[candidate] + .1 < previous[best]) best = candidate
      const alpha = data[(y * width + low + i) * 4 + 3]
      costs[i] = previous[best] + alpha * 10 + Math.abs(low + i - boundary) * .015
      parents[y * span + i] = best
    }
    previous = costs
  }
  let index = 0
  for (let i = 1; i < span; i++) if (previous[i] < previous[index]) index = i
  const result = new Int32Array(height)
  for (let y = height - 1; y >= 0; y--) { result[y] = low + index; index = parents[y * span + index] }
  return result
}

async function main() {
  const inputs = process.argv.slice(2)
  if (inputs.length !== 6) throw Error('Supply the six generated atlas paths in category order.')
  const destination = path.resolve(__dirname, '../public/images/billboard/realistic')
  await fs.mkdir(destination, { recursive: true })
  let total = 0
  for (let c = 0; c < categories.length; c++) {
    const { data, info } = await sharp(inputs[c]).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const { width, height } = info
    const cuts = Array.from({ length: 4 }, (_, i) => seam(data, width, height, width * (i + 1) / 5))
    for (let cell = 0; cell < 5; cell++) {
      const pixels = Buffer.from(data)
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        if ((cell > 0 && x < cuts[cell-1][y]) || (cell < 4 && x >= cuts[cell][y])) pixels[(y * width + x) * 4 + 3] = 0
      }
      const file = `${categories[c]}-${cell+1}.webp`
      const output = await sharp(pixels, { raw: { width, height, channels: 4 } })
        .trim({ background: '#00000000', threshold: 10 })
        .resize({ width: 360, height: 360, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 77, alphaQuality: 85, effort: 6 }).toBuffer()
      await fs.writeFile(path.join(destination, file), output)
      total += output.length
      process.stdout.write(`${file}: ${output.length} bytes\n`)
    }
  }
  process.stdout.write(`Total: ${total} bytes\n`)
}
main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1 })
