export const earthPatches = [
  {at:[43.9,32.4],rx:35,ry:42,color:'dry',angle:-18},
  {at:[44.2,31.2],rx:26,ry:35,color:'dry',angle:15},
  {at:[45.5,33.0],rx:26,ry:24,color:'soil',angle:-25},
  {at:[45.0,32.0],rx:24,ry:16,color:'fertile',angle:25},
  {at:[46.4,31.3],rx:27,ry:18,color:'marsh',angle:24},
  {at:[46.9,30.7],rx:30,ry:17,color:'marsh',angle:-12},
  {at:[48.0,32.8],rx:32,ry:20,color:'rock',angle:30},
  {at:[48.8,32.0],rx:26,ry:34,color:'soil',angle:30},
] as const

export const surfaceColors={dry:'#b17f38',soil:'#ad8654',fertile:'#608550',marsh:'#568e7c',rock:'#786b57'} as const
