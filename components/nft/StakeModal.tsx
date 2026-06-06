// components/nft/StakeModal.tsx
'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

interface StakeModalProps {
  isOpen: boolean
  onClose: () => void
  nftName: string
  onConfirm: (duration: number) => void
}

export function StakeModal({ isOpen, onClose, nftName, onConfirm }: StakeModalProps) {
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const durationOptions = [
    { value: '0', label: 'Flexible - No lock (10% APY)' },
    { value: '30', label: '30 Days - +0% Bonus (10% APY)' },
    { value: '90', label: '90 Days - +5% Bonus (15% APY)' },
    { value: '180', label: '180 Days - +10% Bonus (20% APY)' },
    { value: '365', label: '365 Days - +15% Bonus (25% APY)' }
  ]

  const handleStake = async () => {
    setIsLoading(true)
    await onConfirm(duration)
    setIsLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stake NFT">
      <div className="space-y-5">
        <p className="text-gray-400">
          Staking <span className="text-white font-medium">{nftName}</span> will earn you daily SPY rewards.
        </p>

        <Select
          label="Lock Duration"
          value={duration.toString()}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          options={durationOptions}
        />

        {duration > 0 && (
          <div className="bg-yellow-500/10 rounded-xl p-3">
            <p className="text-yellow-400 text-sm">⚠️ Early withdrawal penalty</p>
            <p className="text-xs text-gray-400 mt-1">
              Withdrawing before lock period ends will forfeit {duration === 30 ? '10%' : duration === 90 ? '25%' : '50%'} of rewards.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" fullWidth>
            Cancel
          </Button>
          <Button onClick={handleStake} isLoading={isLoading} fullWidth>
            Confirm Stake
          </Button>
        </div>
      </div>
    </Modal>
  )
}
