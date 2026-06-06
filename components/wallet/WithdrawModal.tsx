// components/wallet/WithdrawModal.tsx
'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { withdrawalRules } from '@/lib/constants/depositRules'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  maxAmount: number
  onSuccess: () => void
}

export function WithdrawModal({ isOpen, onClose, maxAmount, onSuccess }: WithdrawModalProps) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('usdt')
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const amountNum = parseFloat(amount)
  const fee = Math.max(Math.ceil(amountNum * withdrawalRules.fees.percentage / 100), withdrawalRules.fees.minimumSpy)
  const receiveAmount = amountNum - fee

  const handleWithdraw = async () => {
    if (amountNum < withdrawalRules.minimum.SPY) {
      return
    }
    if (amountNum > maxAmount) {
      return
    }

    setIsLoading(true)
    // API call to withdraw
    setIsLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Funds">
      <div className="space-y-5">
        <div className="bg-navy-800 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Available</span>
            <span className="text-white">{maxAmount.toLocaleString()} SPY</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Minimum</span>
            <span className="text-white">{withdrawalRules.minimum.SPY} SPY</span>
          </div>
        </div>

        <Input
          type="number"
          label="Amount (SPY)"
          placeholder={`Minimum ${withdrawalRules.minimum.SPY}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {amountNum >= withdrawalRules.minimum.SPY && (
          <div className="bg-navy-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Amount</span>
              <span className="text-white">{amountNum} SPY</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Fee ({withdrawalRules.fees.percentage}%)</span>
              <span className="text-yellow-400">{fee} SPY</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-primary-500/20">
              <span className="text-white">You Receive</span>
              <span className="text-green-400">{receiveAmount} SPY</span>
            </div>
          </div>
        )}

        <Select
          label="Withdrawal Method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          options={[
            { value: 'usdt', label: 'USDT (BEP-20)' },
            { value: 'bank', label: 'Bank Transfer (NGN)' }
          ]}
        />

        {method === 'usdt' && (
          <Input
            label="BEP-20 Wallet Address"
            placeholder="0x..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        )}

        {method === 'bank' && (
          <div className="space-y-3">
            <Select
              label="Bank"
              options={[
                { value: 'gtbank', label: 'GTBank' },
                { value: 'access', label: 'Access Bank' },
                { value: 'first', label: 'First Bank' },
                { value: 'uba', label: 'UBA' }
              ]}
            />
            <Input label="Account Number" placeholder="0123456789" />
            <Input label="Account Name" placeholder="Full name" />
          </div>
        )}

        <Button onClick={handleWithdraw} isLoading={isLoading} fullWidth>
          Request Withdrawal
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Processing time: 1-24 hours. Minimum {withdrawalRules.minimum.SPY} SPY.
        </p>
      </div>
    </Modal>
  )
}
