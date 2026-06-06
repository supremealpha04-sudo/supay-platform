// components/layout/AdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Wallet, ArrowUpDown, Gem, ListChecks,
  BarChart3, ShieldAlert, Megaphone, Settings, LogOut
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/deposits', label: 'Deposits', icon: Wallet },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpDown },
  { href: '/admin/nfts', label: 'NFTs', icon: Gem },
  { href: '/admin/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/fraud', label: 'Fraud Alerts', icon: ShieldAlert },
  { href: '/admin/broadcast', label: 'Broadcast', icon: Megaphone },
  { href: '/admin/settings', label: 'Settings', icon: Settings }
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  return (
    <aside className="w-64 bg-navy-800/95 border-r border-primary-500/20 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-primary-500/20">
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
          Supay Admin
        </h1>
        <p className="text-xs text-gray-500 mt-1">Platform Management</p>
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
