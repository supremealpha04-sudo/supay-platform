// components/dashboard/BalanceCard.tsx
'use client'

import { useState } from 'react'
import { Eye, EyeOff, Wallet, TrendingUp, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface BalanceCardProps {
  total: number
  withdrawable: number
  locked: number
  onDeposit: () => void
  onWithdraw: () => void
}

export function BalanceCard({ total, withdrawable, locked, onDeposit, onWithdraw }: BalanceCardProps) {
  const [showBalance, setShowBalance] = useState(true)

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-400">Total Balance</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-white">
              {showBalance ? `${total.toLocaleString()} SPY` : '••••••'}
            </p>
            <button onClick={() => setShowBalance(!showBalance)} className="p-1 hover:bg-white/10 rounded">
              {showBalance ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">≈ ${(total / 100).toFixed(2)} USD</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
          <Wallet className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-500/10 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <p className="text-xs text-gray-400">Withdrawable</p>
          </div>
          <p className="text-lg font-bold text-green-400">{withdrawable.toLocaleString()} SPY</p>
        </div>
        <div className="bg-yellow-500/10 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-gray-400">Locked (30d)</p>
          </div>
          <p className="text-lg font-bold text-yellow-400">{locked.toLocaleString()} SPY</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onDeposit} fullWidth>Deposit</Button>
        <Button onClick={onWithdraw} variant="outline" fullWidth>Withdraw</Button>
      </div>
    </div>
  )
}
