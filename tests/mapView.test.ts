import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../src/game/data.ts'
import { focusCamera, labelLines, MAP_HEIGHT, MAP_WIDTH, mapLevel, terrainWeights, visibleLabels } from '../src/game/mapView.ts'

test('zoom exposes one label scale at a time, with an explicit state-view override', () => {
  assert.equal(mapLevel(.65),'dominion');assert.equal(mapLevel(2.5),'province');assert.equal(mapLevel(4.5),'state')
  assert.equal(mapLevel(1,'state'),'state');assert.equal(mapLevel(.65,'state'),'state')
})
test('crowded labels prefer selected states and reveal additional local names as zoom increases', () => {
  const labels = [
    {id:'selected',text:'Babylon',x:100,y:100,size:13,priority:8,kind:'state' as const},
    {id:'sibling',text:'Borsippa',x:125,y:100,size:13,priority:3,kind:'state' as const},
    {id:'city',text:'Babylon',x:100,y:103,size:10,priority:1,kind:'city' as const},
  ]
  assert.deepEqual(visibleLabels(labels,1).map(p=>p.id),['selected'])
  assert.deepEqual(visibleLabels(labels,4).map(p=>p.id),['selected','sibling','city'])
})

test('terrain detail crossfades continuously without duplicating macro and local features', () => {
  for (let zoom = .65; zoom <= 7; zoom += .025) {
    const weights = terrainWeights(zoom)
    assert.ok(Object.values(weights).every(weight => weight >= 0 && weight <= 1))
    assert.ok(Math.abs(weights.macro + weights.regional + weights.local - 1) < 1e-10)
    assert.equal(weights.macro * weights.local, 0)
    const next = terrainWeights(zoom + .001)
    for (const detail of ['macro', 'regional', 'local'] as const) {
      assert.ok(Math.abs(next[detail] - weights[detail]) < .003)
    }
  }
  assert.deepEqual(terrainWeights(1), { macro: 1, regional: 0, local: 0 })
  assert.deepEqual(terrainWeights(2.5), { macro: 0, regional: 1, local: 0 })
  assert.deepEqual(terrainWeights(5), { macro: 0, regional: 0, local: 1 })
})

test('explicit map views choose their terrain detail independently of camera zoom', () => {
  for (const zoom of [1, 1.5, 3.8, 4.1, 7]) {
    assert.deepEqual(terrainWeights(zoom, 'dominion'), { macro: 1, regional: 0, local: 0 })
    assert.deepEqual(terrainWeights(zoom, 'province'), { macro: 0, regional: 1, local: 0 })
    assert.deepEqual(terrainWeights(zoom, 'state'), { macro: 0, regional: 0, local: 1 })
  }
})

test('focusing any province fits every child polygon on desktop and mobile, with or without details', () => {
  const game = createInitialState()
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    for (const panel of [false, true]) {
      for (const province of game.provinces) {
        const shapes = game.states.filter(state => state.provinceId === province.id).map(state => state.shape)
        const camera = focusCamera(shapes, viewport, panel)
        const scale = Math.min(viewport.width / MAP_WIDTH, viewport.height / MAP_HEIGHT) * camera.zoom
        for (const [x, y] of shapes.flatMap(shape => shape.split(' ').map(point => point.split(',').map(Number)))) {
          const screenX = viewport.width / 2 + (x - camera.x) * scale
          const screenY = viewport.height / 2 + (y - camera.y) * scale
          assert.ok(screenX > 0 && screenX < viewport.width && screenY > 0 && screenY < viewport.height,
            `${province.name} exceeds ${viewport.width}×${viewport.height} with panel=${panel}`)
          if (panel && viewport.width >= 600) {
            assert.ok(screenX < viewport.width - 370, `${province.name} overlaps the desktop details layer`)
          }
        }
      }
    }
  }
})

test('labels can use a configured alternative when a capital marker occupies the preferred anchor', () => {
  const label = { id: 'capital', text: 'Babylon', x: 100, y: 100, size: 18, priority: 10, kind: 'state' as const, alternatives: [{ x: 100, y: 65 }] }
  const visible = visibleLabels([label], 1, [{ left: 87, right: 113, top: 87, bottom: 113 }])
  assert.equal(visible.length, 1)
  assert.equal(visible[0].y, 65)
})

test('local stats move away from wrapped state names and subordinate settlement labels', () => {
  const labels = [
    { id: 'state', text: 'Upper Euphrates', x: 100, y: 100, size: 15, priority: 10, kind: 'state' as const },
    { id: 'city', text: 'Settlement', x: 100, y: 140, size: 11, priority: 1, kind: 'city' as const },
    { id: 'stats', text: '26 garrison\n2 market · 1 fort', x: 100, y: 127, size: 10, priority: 0, kind: 'local' as const, alternatives: [{ x: 100, y: 170 }] },
  ]
  assert.deepEqual(labelLines(labels[2].text), ['26 garrison', '2 market · 1 fort'])
  const visible = visibleLabels(labels, 1)
  assert.deepEqual(visible.map(label => label.id), ['state', 'city', 'stats'])
  assert.equal(visible[2].y, 170)
  assert.deepEqual(visibleLabels(labels.map(label => ({ ...label, alternatives: [] })), 1).map(label => label.id), ['state', 'city'])
})
