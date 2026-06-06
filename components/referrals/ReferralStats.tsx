// components/referrals/ReferralStats.tsx
'use client'

import { Users, Coins, TrendingUp, Award } from 'lucide-react'

interface ReferralStatsProps {
  count: number
  totalEarned: number
  level1Count: number
  level2Count: number
}

export function ReferralStats({ count, totalEarned, level1Count, level2Count }: ReferralStatsProps) {
  const stats = [
    { label: 'Total Referrals', value: count, icon: Users, color: 'text-blue-400' },
    { label: 'Total Earned', value: `${totalEarned.toLocaleString()} SPY`, icon: Coins, color: 'text-green-400' },
    { label: 'Level 1', value: level1Count, icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Level 2', value: level2Count, icon: Award, color: 'text-accent-500' }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="glass rounded-xl p-4 text-center">
            <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        )
      })}
    </div>
  )
}
