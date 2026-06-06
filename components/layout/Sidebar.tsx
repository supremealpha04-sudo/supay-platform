// components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Coins, ListChecks, Gem, Wallet, Users, Trophy,
  Settings, LogOut, Gift, Star, Clock, Medal, History, ArrowUpDown
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/earn', label: 'Earn', icon: Coins },
  { href: '/dashboard/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/dashboard/nft', label: 'NFTs', icon: Gem },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/referrals', label: 'Referrals', icon: Users },
  { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowUpDown },
  { href: '/dashboard/transactions', label: 'History', icon: History },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/premium', label: 'Premium', icon: Star },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings }
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut, profile } = useAuth()

  return (
    <aside className="w-64 bg-navy-800/95 border-r border-primary-500/20 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-primary-500/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500" />
          <span className="text-xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
            Supay
          </span>
        </div>
        {profile && (
          <div className="mt-4 glass rounded-xl p-3">
            <p className="text-xs text-gray-400">Balance</p>
            <p className="text-lg font-bold text-white">{profile.spy_balance?.toLocaleString()} SPY</p>
            <p className="text-xs text-gray-500">≈ ${((profile.spy_balance || 0) / 100).toFixed(2)}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all
                ${isActive
                  ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-white border border-primary-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-primary-500/20">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  )
}
