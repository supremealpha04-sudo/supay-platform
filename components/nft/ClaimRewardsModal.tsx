// components/nft/ClaimRewardsModal.tsx
'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Coins, TrendingUp } from 'lucide-react'

interface ClaimRewardsModalProps {
  isOpen: boolean
  onClose: () => void
  rewards: number
  platformTax: number
  onConfirm: () => void
}

export function ClaimRewardsModal({ isOpen, onClose, rewards, platformTax, onConfirm }: ClaimRewardsModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClaim = async () => {
    setIsLoading(true)
    await onConfirm()
    setIsLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Claim Staking Rewards">
      <div className="space-y-5">
        <div className="bg-navy-800 rounded-xl p-4 text-center">
          <Coins className="w-8 h-8 text-accent-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{rewards} SPY</p>
          <p className="text-sm text-gray-400">Available to claim</p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Rewards</span>
            <span className="text-white">{rewards + platformTax} SPY</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Platform Fee (20%)</span>
            <span className="text-yellow-400">{platformTax} SPY</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-primary-500/20">
            <span className="text-white font-medium">You Receive</span>
            <span className="text-green-400 font-bold">{rewards} SPY</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" fullWidth>
            Cancel
          </Button>
          <Button onClick={handleClaim} isLoading={isLoading} fullWidth>
            Claim Rewards
          </Button>
        </div>
      </div>
    </Modal>
  )
}
