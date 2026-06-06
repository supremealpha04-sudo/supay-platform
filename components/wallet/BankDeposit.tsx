// components/wallet/BankDeposit.tsx
'use client'

interface BankDepositProps {
  amount: number
}

export function BankDeposit({ amount }: BankDepositProps) {
  const amountNGN = amount * 1500

  return (
    <div className="space-y-4">
      <div className="bg-navy-800 rounded-xl p-4">
        <p className="text-sm text-gray-400 mb-2">Transfer to</p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Bank Name</span>
            <span className="text-white">GTBank</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Account Number</span>
            <span className="text-white">0123456789</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Account Name</span>
            <span className="text-white">Supay Limited</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-primary-500/20">
            <span className="text-gray-400">Amount</span>
            <span className="text-accent-500 font-bold">₦{amountNGN.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 rounded-xl p-3">
        <p className="text-blue-400 text-sm font-medium">ℹ️ Instructions</p>
        <ul className="text-xs text-gray-400 mt-2 space-y-1">
          <li>• Use your Supay email as reference</li>
          <li>• Funds credited within 5-30 minutes</li>
          <li>• Upload proof of payment if needed</li>
        </ul>
      </div>
    </div>
  )
}
