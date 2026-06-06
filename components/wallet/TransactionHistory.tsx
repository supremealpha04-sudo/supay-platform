// components/wallet/TransactionHistory.tsx
'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface Transaction {
  id: string
  type: string
  amount_spy: number
  balance_after: number
  created_at: string
}

interface TransactionHistoryProps {
  transactions: Transaction[]
  onLoadMore: () => void
  hasMore: boolean
}

export function TransactionHistory({ transactions, onLoadMore, hasMore }: TransactionHistoryProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = transactions.filter(tx => {
    const matchesSearch = tx.type.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || tx.type === typeFilter
    return matchesSearch && matchesType
  })

  const typeOptions = ['all', 'deposit', 'withdrawal', 'task_reward', 'ad_reward', 'referral_bonus', 'staking_reward', 'nft_purchase']

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-semibold text-white mb-4">Transaction History</h3>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-navy-800 border border-primary-500/30 rounded-lg text-white text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-lg text-white text-sm"
        >
          {typeOptions.map(option => (
            <option key={option} value={option}>{option.replace('_', ' ').toUpperCase()}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filtered.map((tx) => (
          <div key={tx.id} className="flex justify-between items-center p-3 bg-navy-800 rounded-lg">
            <div>
              <p className="text-sm text-white capitalize">{tx.type.replace('_', ' ')}</p>
              <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${tx.amount_spy > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {tx.amount_spy > 0 ? '+' : ''}{tx.amount_spy} SPY
              </p>
              <p className="text-xs text-gray-500">Balance: {tx.balance_after} SPY</p>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full mt-4 py-2 text-sm text-accent-500 hover:text-accent-400 transition"
        >
          Load More
        </button>
      )}

      {filtered.length === 0 && (
        <p className="text-gray-500 text-center py-8">No transactions found</p>
      )}
    </div>
  )
}
