export interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  avatar_url: string | null
  spy_balance: number
  earned_spy: number
  deposited_spy: number
  referral_spy: number
  staking_rewards_spy: number
  total_earned_usd: number
  total_withdrawn_usd: number
  referral_code: string
  referred_by: string | null
  referral_count: number
  referral_earnings: number
  daily_ad_watch_count: number
  last_ad_watch_at: string | null
  daily_bonus_streak: number
  last_bonus_claimed_at: string | null
  is_premium: boolean
  premium_until: string | null
  is_admin: boolean
  is_banned: boolean
  kyc_status: 'pending' | 'verified' | 'rejected' | 'none'
  created_at: string
  updated_at: string
}

export interface NFTBadge {
  token_id: number
  owner_id: string
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
  purchase_price_spy: number
  staking_reward_daily: number
  is_staked: boolean
  staked_since: string | null
  total_rewards_claimed: number
  metadata_uri: string
  created_at: string
}

export interface DepositTransaction {
  id: string
  user_id: string
  amount_usd: number
  amount_ngn: number | null
  spy_received: number
  method: 'crypto' | 'bank' | 'card'
  crypto_network: string | null
  tx_hash: string | null
  status: 'pending' | 'completed' | 'failed'
  unlock_date: string
  created_at: string
}

export interface WithdrawalTransaction {
  id: string
  user_id: string
  amount_spy: number
  amount_usd: number
  method: 'usdt' | 'bank'
  address: string | null
  bank_details: any | null
  fee_spy: number
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'
  admin_notes: string | null
  processed_at: string | null
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  reward_spy: number
  task_url: string | null
  task_type: 'link' | 'survey' | 'video' | 'install'
  required_time_seconds: number
  is_active: boolean
  total_completions: number
  max_completions: number
  expires_at: string | null
  created_at: string
}

export interface CompletedTask {
  id: string
  user_id: string
  task_id: string
  reward_spy: number
  status: 'pending' | 'verified' | 'rejected'
  verified_at: string | null
  created_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  bonus_spy: number
  level: number
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  metadata: any
  created_at: string
}

export interface PremiumSubscription {
  id: string
  user_id: string
  tier: 'Silver' | 'Gold' | 'Platinum'
  cost_spy: number
  start_date: string
  end_date: string
  auto_renew: boolean
  is_active: boolean
}

export interface StakingPosition {
  id: string
  user_id: string
  amount_spy: number
  lock_duration_days: number
  apy: number
  start_date: string
  end_date: string
  last_reward_claim: string
  total_rewards_claimed: number
  is_active: boolean
}

export interface Transaction {
  id: string
  user_id: string
  type: 'deposit' | 'withdrawal' | 'task_reward' | 'ad_reward' | 'referral_bonus' | 'staking_reward' | 'premium_payment' | 'nft_purchase' | 'nft_upgrade'
  amount_spy: number
  balance_before: number
  balance_after: number
  metadata: any
  created_at: string
}
