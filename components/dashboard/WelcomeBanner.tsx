// components/dashboard/WelcomeBanner.tsx
'use client'

import { Gift, Sparkles } from 'lucide-react'

interface WelcomeBannerProps {
  username: string
  streak: number
}

export function WelcomeBanner({ username, streak }: WelcomeBannerProps) {
  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-accent-500" />
          <span className="text-sm text-accent-500">Welcome back!</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Hello, {username}! 👋</h1>
        <p className="text-gray-400 mt-1">Ready to earn today?</p>
        {streak > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <Gift className="w-4 h-4 text-accent-500" />
            <span className="text-sm text-gray-300">{streak} day streak! Keep it up!</span>
          </div>
        )}
      </div>
    </div>
  )
}
