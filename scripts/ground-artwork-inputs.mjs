import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

// Follow the painter's local data/helpers so regenerated geography or changed
// colours cannot silently ship with old terrain artwork.
export function groundArtworkFingerprint(root=process.cwd()){
  const files=new Set()
  const visit=file=>{
    if(files.has(file))return
    files.add(file)
    const source=fs.readFileSync(path.join(root,file),'utf8')
    for(const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){
      let dependency=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]))
      if(!dependency.endsWith('.ts'))dependency+='.ts'
      visit(dependency)
    }
  }
  visit('src/game/groundPaint.ts');visit('src/game/preparedGroundLayout.ts')
  const hash=createHash('sha256')
  for(const file of [...files].sort()){hash.update(file+'\0');hash.update(fs.readFileSync(path.join(root,file)));hash.update('\0')}
  return hash.digest('hex')
}
