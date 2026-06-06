'use client'

import { FaBars, FaBell, FaUserCircle, FaMoon, FaSun } from 'react-icons/fa'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from 'next-themes'

export default function DashboardHeader({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const { profile } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  return (
    <header className="sticky top-0 z-30 glass border-b border-primary-500/20 px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 transition md:hidden"
        >
          <FaBars className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center space-x-4 ml-auto">
          <button className="p-2 rounded-lg hover:bg-white/10 transition">
            <FaBell className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <FaUserCircle className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-white">{profile?.username || 'User'}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}