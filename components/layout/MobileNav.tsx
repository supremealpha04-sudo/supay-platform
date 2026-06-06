// components/layout/MobileNav.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Home, Coins, Wallet, User, Settings } from 'lucide-react'

const bottomNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/earn', label: 'Earn', icon: Coins },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/referrals', label: 'Refer', icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings }
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-primary-500/20 md:hidden z-40">
        <div className="flex justify-around py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-accent-500 transition"
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* FAB for menu */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 md:hidden p-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full shadow-lg"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Slide-out Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 md:hidden" onClick={() => setIsOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-64 glass z-50 md:hidden">
            <div className="flex justify-end p-4">
              <button onClick={() => setIsOpen(false)} className="p-2">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-6 p-3 glass rounded-xl">
                <p className="text-xs text-gray-400">Your Balance</p>
                <p className="text-xl font-bold text-white">1,234 SPY</p>
              </div>
              <nav className="space-y-2">
                {bottomNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5"
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  )
}
