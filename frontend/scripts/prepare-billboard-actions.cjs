// Six generated 5-row x 8-frame atlases -> thirty real action sprite strips.
const sharp = require('sharp')
const fs = require('node:fs/promises')
const path = require('node:path')
const categories = ['good','moderate','sensitive','unhealthy','very','hazardous']

async function cleanFrame(input) {
  const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  const count=info.width*info.height, labels=new Int32Array(count), queue=new Int32Array(count), areas=[0]
  let label=0
  for(let start=0;start<count;start++) {
    if(labels[start] || data[start*4+3]<48) continue
    label++; let head=0,tail=1;queue[0]=start;labels[start]=label
    while(head<tail) {
      const p=queue[head++],x=p%info.width
      for(const next of [x>0?p-1:-1,x<info.width-1?p+1:-1,p-info.width,p+info.width]) if(next>=0 && next<count && !labels[next] && data[next*4+3]>=48) {labels[next]=label;queue[tail++]=next}
    }
    areas[label]=tail
  }
  const largest=Math.max(...areas),threshold=Math.max(25,largest*.08)
  for(let p=0;p<count;p++) if(!labels[p] || areas[labels[p]]<threshold) data[p*4+3]=0
  return sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer()
}

function horizontalSeam(data, width, height, boundary) {
  const low = Math.max(1, Math.floor(boundary - height * .075)), high = Math.min(height-1, Math.ceil(boundary + height * .075))
  const span = high-low+1, parents = new Int16Array(span * width)
  let previous = new Float64Array(span)
  for (let x=0; x<width; x++) {
    const costs = new Float64Array(span)
    for (let i=0; i<span; i++) {
      let best=i
      for (const j of [i-1,i+1]) if (j>=0 && j<span && previous[j]+.1<previous[best]) best=j
      costs[i]=previous[best]+data[((low+i)*width+x)*4+3]*10+Math.abs(low+i-boundary)*.015
      parents[x*span+i]=best
    }
    previous=costs
  }
  let index=0
  for (let i=1;i<span;i++) if(previous[i]<previous[index]) index=i
  const result=new Int32Array(width)
  for(let x=width-1;x>=0;x--) {result[x]=low+index;index=parents[x*span+index]}
  return result
}
async function main() {
  const args = process.argv.slice(2)
  const single = args[0] === '--category'
  const names = single ? [args[1]] : categories
  const inputs = single ? args.slice(2) : args
  if (!inputs.length || inputs.length > names.length || names.some(name => !categories.includes(name))) throw Error('Supply action atlases in AQI category order, or --category <name> <atlas>.')
  const destination = path.resolve(__dirname, '../public/images/billboard/realistic')
  await fs.mkdir(destination, { recursive: true })
  let total = 0
  for (let c = 0; c < inputs.length; c++) {
    const {data,info:metadata}=await sharp(inputs[c]).ensureAlpha().raw().toBuffer({resolveWithObject:true})
    const cuts=Array.from({length:4},(_,i)=>horizontalSeam(data,metadata.width,metadata.height,metadata.height*(i+1)/5))
    for (let row = 0; row < 5; row++) {
      const pixels=Buffer.from(data)
      let top=metadata.height,bottom=0
      for(let y=0;y<metadata.height;y++) for(let x=0;x<metadata.width;x++) {
        const offset=(y*metadata.width+x)*4+3
        if((row>0 && y<cuts[row-1][x]) || (row<4 && y>=cuts[row][x])) pixels[offset]=0
        else if(pixels[offset]>32) {top=Math.min(top,y);bottom=Math.max(bottom,y)}
      }
      top=Math.max(0,top-2);bottom=Math.min(metadata.height-1,bottom+2)
      const height=bottom-top+1
      const frames = []
      for (let col = 0; col < 8; col++) {
        const left = Math.floor(metadata.width * col / 8)
        const width = Math.floor(metadata.width * (col + 1) / 8) - left
        const input = await sharp(pixels,{raw:{width:metadata.width,height:metadata.height,channels:4}}).extract({ left, top, width, height })
          .resize(192, 256, { fit: 'contain', background: '#00000000' }).png().toBuffer()
        frames.push({ input: await cleanFrame(input), left: col * 192, top: 0 })
      }
      const file = `${names[c]}-${row+1}-action.webp`
      const output = await sharp({ create: { width: 1536, height: 256, channels: 4, background: '#00000000' } })
        .composite(frames).webp({ quality: 65, alphaQuality: 80, effort: 6 }).toBuffer()
      await fs.writeFile(path.join(destination, file), output)
      total += output.length
      process.stdout.write(`${file}: ${output.length} bytes\n`)
    }
  }
  process.stdout.write(`Total action artwork: ${total} bytes\n`)
}
main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1 })
