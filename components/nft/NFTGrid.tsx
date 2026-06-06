// components/nft/NFTGrid.tsx
'use client'
import { Gem } from 'lucide-react'
import { NFTCard } from './NFTCard'

interface NFT {
  id: string
  tier: string
  purchase_price_spy: number
  is_staked: boolean
  nft_badges: {
    staking_reward_daily: number
    benefits: { earningMultiplier: number }
    premium_months_required: number
  }
}

interface NFTGridProps {
  nfts: NFT[]
  onStake: (nftId: string) => void
  onUnstake: (nftId: string) => void
}

export function NFTGrid({ nfts, onStake, onUnstake }: NFTGridProps) {
  if (nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <Gem className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500">No NFTs owned yet</p>
        <p className="text-sm text-gray-600">Purchase an NFT to boost your earnings</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {nfts.map((nft) => (
        <NFTCard
          key={nft.id}
          tier={nft.tier}
          price={nft.purchase_price_spy}
          dailyReward={nft.nft_badges.staking_reward_daily}
          multiplier={nft.nft_badges.benefits.earningMultiplier}
          premiumRequired={nft.nft_badges.premium_months_required}
          isOwned={true}
          isStaked={nft.is_staked}
          onStake={() => onStake(nft.id)}
          onUnstake={() => onUnstake(nft.id)}
        />
      ))}
    </div>
  )
}
