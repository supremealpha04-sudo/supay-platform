// components/wallet/BalanceBreakdown.tsx
'use client'

import { Info } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'

interface BalanceBreakdownProps {
  earned: number
  deposited: number
  referral: number
  staking: number
}

export function BalanceBreakdown({ earned, deposited, referral, staking }: BalanceBreakdownProps) {
  const total = earned + deposited + referral + staking

  const items = [
    { label: 'From Tasks & Ads', value: earned, color: 'bg-green-500', tooltip: 'Earned by completing tasks and watching ads' },
    { label: 'From Deposits (Locked 30d)', value: deposited, color: 'bg-yellow-500', tooltip: 'SPY from deposits - locked for 30 days' },
    { label: 'From Referrals', value: referral, color: 'bg-blue-500', tooltip: 'Bonus from referring friends' },
    { label: 'From Staking', value: staking, color: 'bg-purple-500', tooltip: 'Rewards from staking NFTs' }
  ]

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        Balance Breakdown
        <Tooltip content="SPY from different sources">
          <Info className="w-4 h-4 text-gray-500" />
        </Tooltip>
      </h3>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{item.label}</span>
              <span className="text-white">{item.value.toLocaleString()} SPY</span>
            </div>
            <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-500`}
                style={{ width: total > 0 ? `${(item.value / total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-primary-500/20 flex justify-between">
          <span className="text-white font-medium">Total</span>
          <span className="text-white font-bold">{total.toLocaleString()} SPY</span>
        </div>
      </div>
    </div>
  )
}
