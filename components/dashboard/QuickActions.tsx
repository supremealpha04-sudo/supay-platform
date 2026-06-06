// components/dashboard/QuickActions.tsx
'use client'

import Link from 'next/link'
import { Play, ListChecks, Users, Gift, Gem, TrendingUp } from 'lucide-react'

const actions = [
  { href: '/dashboard/earn', label: 'Watch Ads', icon: Play, color: 'from-primary-500 to-accent-500' },
  { href: '/dashboard/tasks', label: 'Complete Tasks', icon: ListChecks, color: 'from-accent-500 to-orange-600' },
  { href: '/dashboard/referrals', label: 'Refer Friends', icon: Users, color: 'from-green-500 to-emerald-600' },
  { href: '/dashboard/daily-bonus', label: 'Daily Bonus', icon: Gift, color: 'from-purple-500 to-pink-500' },
  { href: '/dashboard/nft', label: 'NFT Staking', icon: Gem, color: 'from-indigo-500 to-purple-600' },
  { href: '/dashboard/premium', label: 'Get Premium', icon: TrendingUp, color: 'from-yellow-500 to-amber-600' }
]

export function QuickActions() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className="glass rounded-xl p-4 text-center hover:border-accent-500/50 transition group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-white">{action.label}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
