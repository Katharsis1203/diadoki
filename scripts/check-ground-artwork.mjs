import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { preparedGroundManifest } from '../src/game/preparedGroundManifest.ts'
import { preparedGroundTiles, PREPARED_GROUND_LEVELS, PREPARED_GROUND_RESOLUTIONS } from '../src/game/preparedGroundLayout.ts'
import { mapBounds } from '../src/game/worldTerrain.ts'
import { groundArtworkFingerprint } from './ground-artwork-inputs.mjs'
import { GROUND_TILE_BLEED } from '../src/game/groundTiles.ts'

if(preparedGroundManifest.fingerprint!==groundArtworkFingerprint())throw new Error('Terrain artwork is stale. Run npm run generate:ground; see MAP_GEOGRAPHY.md.')
let count=0,bytes=0
for(const level of PREPARED_GROUND_LEVELS)for(const resolution of PREPARED_GROUND_RESOLUTIONS)for(const tile of preparedGroundTiles([mapBounds],level,resolution,false)){
  const file=preparedGroundManifest.files[tile.key]
  if(!file||path.basename(file)!==file)throw new Error(`Missing/invalid prepared terrain entry ${tile.key}`)
  const data=fs.readFileSync(path.join('public/textures/ground',file))
  const pixels=tile.size*tile.resolution+2*GROUND_TILE_BLEED
  const digest=createHash('sha256').update(data).digest('hex').slice(0,16)
  if(data.length<33||data.toString('hex',0,8)!=='89504e470d0a1a0a'||data.readUInt32BE(16)!==pixels||data.readUInt32BE(20)!==pixels||file!==`${tile.key.replaceAll(':','_')}-${digest}.png`)throw new Error(`Invalid terrain PNG ${file}. Run npm run generate:ground; see MAP_GEOGRAPHY.md.`)
  count++;bytes+=data.byteLength
}
if(count!==Object.keys(preparedGroundManifest.files).length)throw new Error('Unexpected terrain artwork entries. Run npm run generate:ground; see MAP_GEOGRAPHY.md.')
console.log(`Prepared terrain: ${count} checked images, ${(bytes/1024/1024).toFixed(2)} MiB`)
