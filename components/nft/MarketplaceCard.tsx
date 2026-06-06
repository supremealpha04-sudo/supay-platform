// components/nft/MarketplaceCard.tsx
'use client'

import { User, Gem } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface MarketplaceCardProps {
  nft: {
    token_id: number
    tier: string
    price_spy: number
    seller: { username: string }
  }
  onBuy: () => void
}

export function MarketplaceCard({ nft, onBuy }: MarketplaceCardProps) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
          <Gem className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-medium">{nft.tier}</p>
          <p className="text-xs text-gray-500">Token #{nft.token_id}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
        <User className="w-4 h-4" />
        <span>{nft.seller?.username || 'Unknown'}</span>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500">Price</p>
          <p className="text-lg font-bold text-accent-500">{nft.price_spy.toLocaleString()} SPY</p>
        </div>
        <Button onClick={onBuy} size="sm">
          Buy Now
        </Button>
      </div>
    </div>
  )
}
