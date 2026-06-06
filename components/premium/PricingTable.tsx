// components/premium/PricingTable.tsx
'use client'

import { useState } from 'react'
import { PremiumCard } from './PremiumCard'

const plans = [
  {
    tier: 'Silver' as const,
    price: 500,
    multiplier: 2,
    features: [
      '2x earnings on all tasks',
      '2x ad rewards',
      'Priority support',
      'Monthly bonus SPY'
    ]
  },
  {
    tier: 'Gold' as const,
    price: 2000,
    multiplier: 3,
    features: [
      '3x earnings on all tasks',
      '3x ad rewards',
      'Priority support + VIP',
      'Monthly bonus SPY',
      'Exclusive tasks',
      'Reduced withdrawal fees'
    ]
  },
  {
    tier: 'Platinum' as const,
    price: 5000,
    multiplier: 5,
    features: [
      '5x earnings on all tasks',
      '5x ad rewards',
      '24/7 VIP support',
      'Monthly bonus SPY',
      'Exclusive tasks + Early access',
      'Zero withdrawal fees',
      'Revenue share'
    ]
  }
]

interface PricingTableProps {
  currentTier?: string
  onSubscribe: (tier: 'Silver' | 'Gold' | 'Platinum') => void
}

export function PricingTable({ currentTier, onSubscribe }: PricingTableProps) {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setIsAnnual(false)}
          className={`px-4 py-2 rounded-lg transition ${!isAnnual ? 'bg-primary-500 text-white' : 'glass text-gray-400'}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setIsAnnual(true)}
          className={`px-4 py-2 rounded-lg transition ${isAnnual ? 'bg-primary-500 text-white' : 'glass text-gray-400'}`}
        >
          Annual <span className="text-xs text-green-400">Save 20%</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PremiumCard
            key={plan.tier}
            tier={plan.tier}
            price={isAnnual ? Math.floor(plan.price * 12 * 0.8) : plan.price}
            multiplier={plan.multiplier}
            features={plan.features}
            isCurrent={currentTier === plan.tier}
            onSubscribe={() => onSubscribe(plan.tier)}
          />
        ))}
      </div>
    </div>
  )
}
