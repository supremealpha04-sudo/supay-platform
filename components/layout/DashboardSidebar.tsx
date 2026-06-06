'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaHome, FaCoins, FaTasks, FaWallet, FaSignOutAlt } from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardSidebar({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: FaHome },
    { href: '/dashboard/earn', label: 'Earn', icon: FaCoins },
    { href: '/dashboard/tasks', label: 'Tasks', icon: FaTasks },
    { href: '/dashboard/wallet', label: 'Wallet', icon: FaWallet },
  ]

  return (
    <aside className="fixed md:static inset-y-0 left-0 z-50 w-72 bg-navy-800/95 backdrop-blur-xl border-r border-primary-500/20 transform transition-transform duration-300">
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-primary-500/20">
          <span className="text-2xl font-bold text-white">Supay</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <button onClick={signOut} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 mt-4">
            <FaSignOutAlt className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </aside>
  )
}