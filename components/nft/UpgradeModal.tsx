// components/nft/UpgradeModal.tsx
'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Gem } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentTier: string
  targetTier: string
  cost: number
  newMultiplier: number
  newDailyReward: number
  onConfirm: () => void
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentTier,
  targetTier,
  cost,
  newMultiplier,
  newDailyReward,
  onConfirm
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    setIsLoading(true)
    await onConfirm()
    setIsLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade NFT">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="text-center flex-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center mx-auto mb-2">
              <Gem className="w-8 h-8 text-white" />
            </div>
            <p className="text-white font-medium">{currentTier}</p>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-500" />
          <div className="text-center flex-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mx-auto mb-2">
              <Gem className="w-8 h-8 text-white" />
            </div>
            <p className="text-white font-medium">{targetTier}</p>
          </div>
        </div>

        <div className="bg-navy-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Upgrade Cost</span>
            <span className="text-accent-500">{cost.toLocaleString()} SPY</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">New Daily Reward</span>
            <span className="text-green-400">{newDailyReward} SPY/day</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">New Multiplier</span>
            <span className="text-white">{newMultiplier}x earnings</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" fullWidth>
            Cancel
          </Button>
          <Button onClick={handleUpgrade} isLoading={isLoading} fullWidth>
            Confirm Upgrade
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Upgrading burns your current NFT and mints a new one with better benefits
        </p>
      </div>
    </Modal>
  )
}
