export type SettlementTier = 'homestead' | 'village' | 'fortress' | 'city'
export type AppearanceThresholds = { village: number; fortress: number; city: number }

// Future development-point scale requested for the full settlement system.
export const DEVELOPMENT_POINT_THRESHOLDS: AppearanceThresholds = {village:3,fortress:10,city:20}
// Today's scenario uses market levels (initially 0–2), not development points.
// Read that existing value without adding another mutable gameplay counter.
export const MARKET_LEVEL_THRESHOLDS: AppearanceThresholds = {village:1,fortress:2,city:3}
export const SETTLEMENT_SCALES: Record<SettlementTier,number> = {homestead:.22,village:.30,fortress:.44,city:.58}

export function settlementAppearance(development: number, isCapital: boolean, thresholds=MARKET_LEVEL_THRESHOLDS) {
  const tier: SettlementTier = isCapital ? 'city' : development>=thresholds.city ? 'city' :
    development>=thresholds.fortress ? 'fortress' : development>=thresholds.village ? 'village' : 'homestead'
  return {tier,scale:isCapital?.72:SETTLEMENT_SCALES[tier]}
}
