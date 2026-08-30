// types/nft.ts
export interface NFTBadge {
  id: string
  tier: 'Genesis' | 'Legendary' | 'Rare' | 'Collector'
  name: string
  description: string
  price_spy: number
  daily_reward_spy: number
  max_supply: number
  current_supply: number
  image_url: string
  created_at: string
}

export interface UserNFT {
  id: string
  user_id: string
  badge_id: string
  token_id: string
  is_staked: boolean
  staked_since: string
  total_rewards_earned: number
  created_at: string
  badge: NFTBadge
}

export interface NFTListing {
  id: string
  nft_id: string
  seller_id: string
  price_spy: number
  status: 'active' | 'sold' | 'cancelled'
  created_at: string
  user_nfts?: UserNFT
}

export const TIER_COLORS: Record<string, string> = {
  Genesis: 'from-purple-600 to-pink-600 border-purple-400',
  Legendary: 'from-cyan-500 to-blue-500 border-cyan-400',
  Rare: 'from-blue-500 to-indigo-500 border-blue-400',
  Collector: 'from-green-500 to-emerald-500 border-green-400'
}

export const TIER_ICONS: Record<string, string> = {
  Genesis: '👑',
  Legendary: '💎',
  Rare: '⭐',
  Collector: '🟢'
}

export const STAKING_APY: Record<string, number> = {
  Genesis: 8,
  Legendary: 6,
  Rare: 5,
  Collector: 4
}

export const TIER_PRICES: Record<string, number> = {
  Genesis: 30000,
  Legendary: 18000,
  Rare: 9000,
  Collector: 2000
}

export const TIER_SUPPLY: Record<string, number> = {
  Genesis: 100,
  Legendary: 400,
  Rare: 1500,
  Collector: 3000
}

export const TIER_DAILY_REWARD: Record<string, number> = {
  Genesis: 0.066,
  Legendary: 0.036,
  Rare: 0.021,
  Collector: 0.0042
}
