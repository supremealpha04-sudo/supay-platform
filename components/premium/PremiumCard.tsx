// components/premium/PremiumCard.tsx
'use client'

import { Check, Star, Gem, Crown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PremiumCardProps {
  tier: 'Silver' | 'Gold' | 'Platinum'
  price: number
  features: string[]
  multiplier: number
  isCurrent: boolean
  onSubscribe: () => void
}

const tierIcons = {
  Silver: Star,
  Gold: Gem,
  Platinum: Crown
}

const tierColors = {
  Silver: 'from-gray-300 to-gray-500',
  Gold: 'from-yellow-400 to-yellow-600',
  Platinum: 'from-cyan-400 to-blue-600'
}

export function PremiumCard({ tier, price, features, multiplier, isCurrent, onSubscribe }: PremiumCardProps) {
  const Icon = tierIcons[tier]
  const bgColor = tierColors[tier]

  return (
    <div className={`glass rounded-xl p-6 transition-all ${isCurrent ? 'border-accent-500 ring-2 ring-accent-500/50' : 'hover:border-accent-500/50'}`}>
      <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${bgColor} flex items-center justify-center mx-auto mb-4`}>
        <Icon className="w-8 h-8 text-white" />
      </div>

      <h3 className="text-2xl font-bold text-white text-center">{tier}</h3>
      <p className="text-accent-500 text-center text-sm mb-4">{multiplier}x Earnings</p>

      <div className="text-center mb-4">
        <span className="text-3xl font-bold text-white">{price}</span>
        <span className="text-gray-400"> SPY/month</span>
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
            <Check className="w-4 h-4 text-green-400" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        onClick={onSubscribe}
        variant={isCurrent ? 'outline' : 'primary'}
        fullWidth
        disabled={isCurrent}
      >
        {isCurrent ? 'Current Plan' : `Upgrade to ${tier}`}
      </Button>
    </div>
  )
}
