// components/premium/SubscribeModal.tsx
'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { CreditCard, Coins } from 'lucide-react'

interface SubscribeModalProps {
  isOpen: boolean
  onClose: () => void
  tier: string
  price: number
  onConfirm: (method: 'spy' | 'card') => void
}

export function SubscribeModal({ isOpen, onClose, tier, price, onConfirm }: SubscribeModalProps) {
  const [method, setMethod] = useState<'spy' | 'card'>('spy')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    setIsLoading(true)
    await onConfirm(method)
    setIsLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Subscribe to ${tier}`}>
      <div className="space-y-5">
        <div className="bg-navy-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{price} SPY</p>
          <p className="text-sm text-gray-400">per month</p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 glass rounded-xl cursor-pointer">
            <input
              type="radio"
              name="method"
              value="spy"
              checked={method === 'spy'}
              onChange={() => setMethod('spy')}
              className="w-4 h-4 text-accent-500"
            />
            <Coins className="w-5 h-5 text-accent-500" />
            <div>
              <p className="text-white text-sm">Pay with SPY</p>
              <p className="text-xs text-gray-500">Use your SPY balance</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 glass rounded-xl cursor-pointer">
            <input
              type="radio"
              name="method"
              value="card"
              checked={method === 'card'}
              onChange={() => setMethod('card')}
              className="w-4 h-4 text-accent-500"
            />
            <CreditCard className="w-5 h-5 text-accent-500" />
            <div>
              <p className="text-white text-sm">Pay with Card</p>
              <p className="text-xs text-gray-500">${(price / 100).toFixed(2)} USD</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" fullWidth>
            Cancel
          </Button>
          <Button onClick={handleSubscribe} isLoading={isLoading} fullWidth>
            Subscribe Now
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Cancel anytime. Subscription auto-renews monthly.
        </p>
      </div>
    </Modal>
  )
}
