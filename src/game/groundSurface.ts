export const earthPatches = [
  {at:[43.9,32.4],rx:35,ry:42,color:'dry',angle:-18},
  {at:[44.2,31.2],rx:26,ry:35,color:'dry',angle:15},
  {at:[45.5,33.0],rx:26,ry:24,color:'soil',angle:-25},
  {at:[45.0,32.0],rx:24,ry:16,color:'fertile',angle:25},
  {at:[46.4,31.3],rx:27,ry:18,color:'marsh',angle:24},
  {at:[46.9,30.7],rx:30,ry:17,color:'marsh',angle:-12},
  {at:[48.0,32.8],rx:32,ry:20,color:'rock',angle:30},
  {at:[48.8,32.0],rx:26,ry:34,color:'soil',angle:30},
  {at:[44.65,32.48],rx:34,ry:42,color:'irrigated',angle:-24},
  {at:[45.80,31.55],rx:42,ry:24,color:'irrigated',angle:24},
  {at:[43.50,35.55],rx:20,ry:43,color:'irrigated',angle:-16},
  {at:[48.25,31.85],rx:35,ry:40,color:'susian',angle:25},
  {at:[46.60,35.20],rx:26,ry:50,color:'foothill',angle:-33},
  {at:[48.60,33.00],rx:30,ry:48,color:'foothill',angle:-30},
  {at:[50.00,31.80],rx:30,ry:36,color:'foothill',angle:-25},
  {at:[48.90,35.10],rx:55,ry:42,color:'steppe',angle:15},
  {at:[50.50,34.30],rx:65,ry:46,color:'steppe',angle:-15},
  {at:[51.30,34.20],rx:28,ry:18,color:'salt',angle:12},
  {at:[50.30,35.80],rx:24,ry:17,color:'salt',angle:-10},
  {at:[53.40,30.50],rx:78,ry:55,color:'persis',angle:18},
  {at:[53.90,28.65],rx:64,ry:30,color:'persis',angle:-15},
] as const

export const surfaceColors={dry:'#b17f38',soil:'#ad8654',fertile:'#608550',marsh:'#568e7c',rock:'#786b57',
  irrigated:'#65924d',susian:'#a0aa79',foothill:'#b49a72',steppe:'#b99c66',salt:'#eee1bc',persis:'#c3a06b'} as const
export const surfaceOpacity:Record<keyof typeof surfaceColors,number>={dry:.22,soil:.22,fertile:.22,marsh:.22,rock:.22,
  irrigated:.42,susian:.30,foothill:.28,steppe:.32,salt:.42,persis:.30}
