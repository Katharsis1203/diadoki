// The fixed geographic projection is independent of campaign initialization.
export const project = ([lon, lat]: readonly [number, number]): [number, number] => [60 + (lon - 29) * 33, 35 + (43 - lat) * 40]
