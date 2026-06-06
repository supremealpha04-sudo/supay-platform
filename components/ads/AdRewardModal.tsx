// components/ads/AdRewardModal.tsx
'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Coins, CheckCircle } from 'lucide-react'

interface AdRewardModalProps {
  isOpen: boolean
  onClose: () => void
  reward: number
}

export function AdRewardModal({ isOpen, onClose, reward }: AdRewardModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ad Completed!">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">+{reward} SPY</p>
          <p className="text-sm text-gray-400">Added to your balance</p>
        </div>
        <Button onClick={onClose} fullWidth>
          Continue Earning
        </Button>
      </div>
    </Modal>
  )
}
