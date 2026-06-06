// components/nft/NFTCard.tsx
'use client'

import { Gem, Star, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface NFTCardProps {
  tier: string
  price: number
  dailyReward: number
  multiplier: number
  premiumRequired: number
  isOwned?: boolean
  isStaked?: boolean
  onPurchase?: () => void
  onStake?: () => void
  onUnstake?: () => void
}

export function NFTCard({
  tier,
  price,
  dailyReward,
  multiplier,
  premiumRequired,
  isOwned = false,
  isStaked = false,
  onPurchase,
  onStake,
  onUnstake
}: NFTCardProps) {
  const tierColors = {
    Bronze: 'from-amber-600 to-amber-800',
    Silver: 'from-gray-300 to-gray-500',
    Gold: 'from-yellow-400 to-yellow-600',
    Platinum: 'from-gray-400 to-gray-600',
    Diamond: 'from-cyan-400 to-blue-600'
  }

  const gradient = tierColors[tier as keyof typeof tierColors] || tierColors.Bronze

  return (
    <div className={`glass rounded-xl p-5 transition-all ${!isOwned ? 'hover:border-accent-500/50' : ''}`}>
      <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center mx-auto mb-3`}>
        <Gem className="w-8 h-8 text-white" />
      </div>

      <h3 className="text-xl font-bold text-white text-center">{tier}</h3>

      {isOwned && isStaked && (
        <Badge variant="success" size="sm" className="mt-2 mx-auto w-fit">Staked</Badge>
      )}

      <div className="space-y-2 mt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Price</span>
          <span className="text-accent-500">{price.toLocaleString()} SPY</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Daily Reward</span>
          <span className="text-green-400">{dailyReward} SPY</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Earning Multiplier</span>
          <span className="text-white">{multiplier}x</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Premium Required</span>
          <span className="text-purple-400">{premiumRequired} months</span>
        </div>
      </div>

      {!isOwned && (
        <Button onClick={onPurchase} fullWidth className="mt-4">
          Purchase
        </Button>
      )}

      {isOwned && !isStaked && (
        <Button onClick={onStake} variant="outline" fullWidth className="mt-4">
          Stake NFT
        </Button>
      )}

      {isOwned && isStaked && (
        <Button onClick={onUnstake} variant="outline" fullWidth className="mt-4">
          Unstake
        </Button>
      )}
    </div>
  )
}
