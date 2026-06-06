// components/wallet/DepositModal.tsx
'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { CryptoDeposit } from './CryptoDeposit'
import { BankDeposit } from './BankDeposit'
import { CardDeposit } from './CardDeposit'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
  const [activeTab, setActiveTab] = useState('crypto')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const tabs = [
    { id: 'crypto', label: 'USDT' },
    { id: 'bank', label: 'Bank Transfer' },
    { id: 'card', label: 'Card' }
  ]

  const handleDeposit = async () => {
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 7) {
      // Show error
      return
    }

    setIsLoading(true)
    // Handle deposit based on activeTab
    setIsLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deposit Funds">
      <div className="space-y-5">
        <div className="bg-navy-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{amount ? `${amount} USD` : 'Enter amount'}</p>
          <p className="text-sm text-gray-400">≈ {amount ? `${parseFloat(amount) * 100} SPY` : '0 SPY'}</p>
        </div>

        <Input
          type="number"
          placeholder="Amount (USD)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={7}
          step={1}
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'crypto' && <CryptoDeposit amount={parseFloat(amount) || 0} />}
        {activeTab === 'bank' && <BankDeposit amount={parseFloat(amount) || 0} />}
        {activeTab === 'card' && <CardDeposit amount={parseFloat(amount) || 0} onSuccess={onSuccess} />}

        <Button onClick={handleDeposit} isLoading={isLoading} fullWidth>
          Continue to Payment
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Minimum deposit: $7 USD. Deposited SPY is locked for 30 days for security.
        </p>
      </div>
    </Modal>
  )
}
