// components/layout/Header.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Bell, User, LogOut, Settings, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'

export function Header() {
  const { profile, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/earn', label: 'Earn' },
    { href: '/dashboard/tasks', label: 'Tasks' },
    { href: '/dashboard/nft', label: 'NFTs' },
    { href: '/dashboard/wallet', label: 'Wallet' }
  ]

  const userMenuItems = [
    { label: 'Profile', icon: <User className="w-4 h-4" />, onClick: () => window.location.href = '/dashboard/settings' },
    { label: 'Settings', icon: <Settings className="w-4 h-4" />, onClick: () => window.location.href = '/dashboard/settings' },
    { label: 'Logout', icon: <LogOut className="w-4 h-4" />, onClick: signOut }
  ]

  if (profile?.is_admin) {
    userMenuItems.unshift({
      label: 'Admin Panel',
      icon: <Shield className="w-4 h-4" />,
      onClick: () => window.location.href = '/admin'
    })
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-primary-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
              Supay
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-300 hover:text-white transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-white/10 transition">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>

            <Dropdown
              trigger={
                <div className="flex items-center gap-2 cursor-pointer">
                  <Avatar src={profile?.avatar_url} size="sm" />
                  <span className="hidden md:block text-sm text-white">{profile?.username}</span>
                </div>
              }
              items={userMenuItems}
            />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary-500/20 py-4">
          <nav className="flex flex-col gap-2 px-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
