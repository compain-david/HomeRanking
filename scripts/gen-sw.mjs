// Rewrites the service worker's precache list with the hashed filenames Vite
// produced, and stamps a cache name unique to this build so old caches drop.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const dist = 'dist'
const assets = [
  ...readdirSync(join(dist, 'assets')).map((f) => `./assets/${f}`),
  // self-hosted faces, or the typography degrades the moment you go offline
  ...readdirSync(join(dist, 'fonts')).map((f) => `./fonts/${f}`),
]
const swPath = join(dist, 'sw.js')
const src = readFileSync(swPath, 'utf8')

const buildId = createHash('sha256')
  .update(assets.sort().join('|'))
  .digest('hex')
  .slice(0, 10)

writeFileSync(
  swPath,
  src
    .replace('__PRECACHE_LIST__', JSON.stringify(assets))
    .replace('__BUILD_ID__', buildId),
)

console.log(`sw: precaching ${assets.length} assets, build ${buildId}`)
