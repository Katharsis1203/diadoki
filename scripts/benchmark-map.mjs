// Informational median timings; no machine-dependent thresholds or gameplay mutations.
import { createInitialState } from '../src/game/data.ts'
import { politicalBorderPaths } from '../src/game/politicalGeography.ts'
import { prepareMapScene } from '../src/game/mapScene.ts'
import { mapBorderPaths, pointInState } from '../src/game/geography.ts'
import { sceneryObjects } from '../src/game/babyloniaScenery.ts'
import { focusCamera } from '../src/game/mapView.ts'
import { mapProjection } from '../src/game/mapProjection.ts'
import { movementPath } from '../src/game/engine.ts'

const game = createInitialState()
const projection = mapProjection(true)
const shapes = game.states.filter(state => state.provinceId === 'babylonia').map(state => state.shape)
const tasks = {
  reset: { count: 50, work: () => createInitialState().states.length },
  borderPaths: { count: 300, work: () => mapBorderPaths(game.states).frontiers.length },
  theatreBorders: {count:100,work:()=>politicalBorderPaths(game.states).frontiers.length},
  provinceScene: {count:300,work:()=>prepareMapScene(game,projection,2.5,3,'province',true,true).objects.length},
  overviewScene: {count:300,work:()=>prepareMapScene(game,projection,.45,.5,'dominion',true,true).dominionLabels.length},
  labelContainment: {
    count: 100,
    work: () => game.states.reduce((count, state) => count + [-95,-65,-45,0,45,65,95]
      .filter(dx => pointInState([state.labelX + dx, state.labelY], state.id)).length, 0),
  },
  provinceFit: { count: 500, work: () => focusCamera(shapes, { width: 1440, height: 900 }, false, true).zoom },
  scenery: { count: 1000, work: () => sceneryObjects(projection, 2.5, 3, 'province', game.states).length },
  movement: { count: 1000, work: () => movementPath(game, 'ur')?.length ?? 0 },
}

let checksum = 0
const results = {}
for (const [name, { count, work }] of Object.entries(tasks)) {
  for (let warmup = 0; warmup < 10; warmup++) checksum += work()
  const milliseconds = []
  for (let sample = 0; sample < 7; sample++) {
    const start = performance.now()
    for (let iteration = 0; iteration < count; iteration++) checksum += work()
    milliseconds.push((performance.now() - start) / count)
  }
  milliseconds.sort((a,b) => a-b)
  results[name] = { iterations: count, medianMs: milliseconds[3] }
}
console.log(JSON.stringify({ results, checksum }, null, 2))
