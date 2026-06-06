// components/wallet/WithdrawalStatus.tsx
'use client'

import { Clock, CheckCircle, XCircle, Send, AlertCircle } from 'lucide-react'

interface WithdrawalStatusProps {
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected'
  amount: number
  fee: number
  createdAt: string
}

export function WithdrawalStatus({ status, amount, fee, createdAt }: WithdrawalStatusProps) {
  const steps = [
    { key: 'pending', label: 'Request Submitted', icon: Clock, description: 'Admin will review your request' },
    { key: 'approved', label: 'Approved', icon: CheckCircle, description: 'Request approved, processing payment' },
    { key: 'processing', label: 'Processing', icon: Send, description: 'Payment being sent to your account' },
    { key: 'completed', label: 'Completed', icon: CheckCircle, description: 'Funds sent successfully' }
  ]

  const currentIndex = steps.findIndex(s => s.key === status)
  const isRejected = status === 'rejected'

  if (isRejected) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <XCircle className="w-6 h-6 text-red-400" />
          <div>
            <p className="text-red-400 font-medium">Withdrawal Rejected</p>
            <p className="text-sm text-gray-400">Your withdrawal request was rejected. Funds have been returned.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-navy-800 rounded-xl p-4">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">Amount</span>
          <span className="text-white">{amount} SPY</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">Fee</span>
          <span className="text-yellow-400">{fee} SPY</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Requested</span>
          <span className="text-gray-400">{new Date(createdAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="relative">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex

          return (
            <div key={step.key} className="flex gap-3 mb-4 last:mb-0">
              <div className="relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500/20' : 'bg-navy-700'}`}>
                  <Icon className={`w-4 h-4 ${isCompleted ? 'text-green-400' : 'text-gray-500'}`} />
                </div>
                {index < steps.length - 1 && (
                  <div className={`absolute top-8 left-4 w-0.5 h-12 ${isCompleted ? 'bg-green-500/30' : 'bg-navy-700'}`} />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className={`font-medium ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                  {step.label}
                  {isCurrent && <span className="ml-2 text-xs text-accent-500">In Progress</span>}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
