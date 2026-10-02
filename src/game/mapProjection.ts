// Rendering only. Campaign geometry and saved positions stay in map space.
export type MapPoint = readonly [number, number]
export const PERSPECTIVE_Y_SCALE = .84
const PIVOT_Y = 325

function createProjection(enabled: boolean) {
  const yScale = enabled ? PERSPECTIVE_Y_SCALE : 1
  const offsetY = PIVOT_Y * (1-yScale)
  return {
    yScale,
    groundTransform: `matrix(1 0 0 ${yScale} 0 ${offsetY})`,
    point: ([x,y]: MapPoint): [number,number] => [x,y*yScale+offsetY],
    inverse: ([x,y]: MapPoint): [number,number] => [x,(y-offsetY)/yScale],
  }
}
export type MapProjection = ReturnType<typeof createProjection>
const flatProjection = Object.freeze(createProjection(false))
const angledProjection = Object.freeze(createProjection(true))
// Stable references also let unchanged SVG layers skip React reconciliation.
export const mapProjection = (enabled: boolean): MapProjection => enabled ? angledProjection : flatProjection

// A screen drag changes canonical camera coordinates, including the ground tilt.
export function cameraPan(dx: number, dy: number, scale: number, projection: MapProjection): MapPoint {
  return [dx/scale,dy/(scale*projection.yScale)]
}
