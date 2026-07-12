export type AdTier = 'cpm' | 'cpc' | 'cpa' | 'premium_video' | 'offerwall'
export type UserTier = 'new' | 'active' | 'whale'

interface TierConfig {
  platformEarnsMin: number
  platformEarnsMax: number
  userPayoutMin: number
  userPayoutMax: number
  description: string
}

const REWARD_TIERS: Record<AdTier, TierConfig> = {
  cpm: {
    platformEarnsMin: 0.0003,
    platformEarnsMax: 0.001,
    userPayoutMin: 0.1,
    userPayoutMax: 0.5,
    description: 'Banner ads - break even, attract users',
  },
  cpc: {
    platformEarnsMin: 0.01,
    platformEarnsMax: 0.05,
    userPayoutMin: 0.5,
    userPayoutMax: 2,
    description: 'Click ads - user must interact',
  },
  cpa: {
    platformEarnsMin: 1.00,
    platformEarnsMax: 50.00,
    userPayoutMin: 10,
    userPayoutMax: 500,
    description: 'Offers - surveys, installs, signups',
  },
  premium_video: {
    platformEarnsMin: 0.01,
    platformEarnsMax: 0.05,
    userPayoutMin: 1,
    userPayoutMax: 5,
    description: 'High-CPM video ads',
  },
  offerwall: {
    platformEarnsMin: 0.50,
    platformEarnsMax: 20.00,
    userPayoutMin: 5,
    userPayoutMax: 200,
    description: 'Offer wall completions',
  },
}

export interface RewardResult {
  reward: number
  platformEarnings: number
  platformProfit: number
  userValue: number
  tier: AdTier
  userTier: UserTier
  isPremium: boolean
}

export async function getUserTier(
  userId: string,
  supabase: any
): Promise<UserTier> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: stats } = await supabase
    .from('ad_watches')
    .select('reward_spy')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo)

  const monthlyEarnings = stats?.reduce(
    (sum: number, w: any) => sum + (w.reward_spy || 0),
    0
  ) || 0

  const monthlyUSD = monthlyEarnings * 0.01

  if (monthlyUSD > 50) return 'whale'
  if (monthlyUSD > 5) return 'active'
  return 'new'
}

export function calculateReward(
  adTier: AdTier,
  userTier: UserTier,
  isPremium: boolean,
  qualityScore: number = 1
): RewardResult {
  const config = REWARD_TIERS[adTier]

  const range = config.userPayoutMax - config.userPayoutMin
  const randomFactor = Math.random()
  let baseReward = config.userPayoutMin + randomFactor * range

  const tierMultipliers: Record<UserTier, number> = {
    new: 1.5,
    active: 1.0,
    whale: 0.6,
  }
  baseReward *= tierMultipliers[userTier]

  const qualityMultiplier = 0.8 + qualityScore * 0.4
  baseReward *= qualityMultiplier

  if (isPremium) baseReward *= 2

  const finalReward = Math.round(baseReward * 10) / 10

  const platformEarnings =
    config.platformEarnsMin +
    Math.random() * (config.platformEarnsMax - config.platformEarnsMin)

  const userValue = finalReward * 0.01
  const platformProfit = platformEarnings - userValue

  return {
    reward: finalReward,
    platformEarnings: Math.round(platformEarnings * 10000) / 10000,
    platformProfit: Math.round(platformProfit * 10000) / 10000,
    userValue: Math.round(userValue * 10000) / 10000,
    tier: adTier,
    userTier,
    isPremium,
  }
}

export function quickReward(
  adTier: AdTier,
  userTier: UserTier = 'new',
  isPremium: boolean = false
): number {
  const result = calculateReward(adTier, userTier, isPremium)
  return result.reward
}
