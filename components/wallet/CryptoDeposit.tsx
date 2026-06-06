// components/wallet/CryptoDeposit.tsx
'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CryptoDepositProps {
  amount: number
}

export function CryptoDeposit({ amount }: CryptoDepositProps) {
  const [copied, setCopied] = useState(false)
  const address = '0x1234567890123456789012345678901234567890'

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="bg-navy-800 rounded-xl p-4">
        <p className="text-sm text-gray-400 mb-2">Send exactly</p>
        <p className="text-2xl font-bold text-white">{amount} USDT</p>
        <p className="text-xs text-gray-500 mt-1">on BEP-20 network</p>
      </div>

      <div>
        <p className="text-sm text-gray-400 mb-2">To this address</p>
        <div className="flex items-center gap-2 bg-navy-800 rounded-xl p-3">
          <code className="flex-1 text-sm text-accent-500 break-all">{address}</code>
          <button onClick={copyToClipboard} className="p-2 hover:bg-white/10 rounded-lg">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </div>

      <div className="bg-yellow-500/10 rounded-xl p-3">
        <p className="text-yellow-400 text-sm font-medium">⚠️ Important</p>
        <ul className="text-xs text-gray-400 mt-2 space-y-1">
          <li>• Send only USDT on BEP-20 network</li>
          <li>• Minimum deposit: $7 USD</li>
          <li>• Funds credited within 1-5 minutes</li>
          <li>• Deposited SPY locked for 30 days</li>
        </ul>
      </div>
    </div>
  )
}
