// components/nft/StakingRewardsCard.tsx
'use client'

import { useState } from 'react'
import { TrendingUp, Clock, Gift } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface StakingRewardsCardProps {
  dailyReward: number
  stakedNfts: number
  totalRewards: number
  pendingRewards: number
  onClaim: () => void
}

export function StakingRewardsCard({
  dailyReward,
  stakedNfts,
  totalRewards,
  pendingRewards,
  onClaim
}: StakingRewardsCardProps) {
  const [isClaiming, setIsClaiming] = useState(false)

  const handleClaim = async () => {
    setIsClaiming(true)
    await onClaim()
    setIsClaiming(false)
  }

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-accent-500" />
        Staking Rewards
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-navy-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">Daily Reward</p>
          <p className="text-xl font-bold text-green-400">{dailyReward} SPY</p>
          <p className="text-xs text-gray-500">from {stakedNfts} NFTs</p>
        </div>
        <div className="bg-navy-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">Pending Rewards</p>
          <p className="text-xl font-bold text-accent-500">{pendingRewards} SPY</p>
        </div>
      </div>

      <div className="bg-navy-800 rounded-lg p-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Rewards Claimed</span>
          <span className="text-white">{totalRewards.toLocaleString()} SPY</span>
        </div>
      </div>

      <Button
        onClick={handleClaim}
        isLoading={isClaiming}
        disabled={pendingRewards === 0}
        fullWidth
      >
        <Gift className="w-4 h-4" />
        Claim Rewards
      </Button>

      <p className="text-xs text-gray-500 text-center mt-3">
        Rewards accumulate daily while NFTs are staked
      </p>
    </div>
  )
}
