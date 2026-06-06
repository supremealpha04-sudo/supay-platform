// components/dashboard/StatsCard.tsx
'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  change?: number
  suffix?: string
}

export function StatsCard({ title, value, icon, change, suffix = '' }: StatsCardProps) {
  return (
    <div className="glass rounded-xl p-5 border border-primary-500/20 hover:border-primary-500/40 transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {value}{suffix}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  )
}
