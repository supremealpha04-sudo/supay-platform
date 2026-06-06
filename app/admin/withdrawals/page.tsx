'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, CheckCircle, XCircle, Clock, Send, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const supabase = createClient()

interface Withdrawal {
  id: string
  user_id: string
  amount_spy: number
  amount_usd: number
  fee_spy: number
  method: string
  address: string
  bank_details: any
  status: string
  created_at: string
  profiles: { username: string }
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  async function fetchWithdrawals() {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setWithdrawals(data)
    }
    setIsLoading(false)
  }

  async function processWithdrawal(withdrawalId: string, action: 'approved' | 'rejected') {
    setProcessingId(withdrawalId)
    
    // Simulate processing (in production, call actual crypto/bank API)
    await new Promise(resolve => setTimeout(resolve, 2000))

    const { error } = await supabase
      .from('withdrawals')
      .update({ 
        status: action === 'approved' ? 'processing' : 'rejected',
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)

    if (!error) {
      const withdrawal = withdrawals.find(w => w.id === withdrawalId)
      if (withdrawal && action === 'rejected') {
        // Refund SPY to user
        const { data: user } = await supabase
          .from('profiles')
          .select('spy_balance')
          .eq('id', withdrawal.user_id)
          .single()

        await supabase
          .from('profiles')
          .update({ spy_balance: (user?.spy_balance || 0) + withdrawal.amount_spy })
          .eq('id', withdrawal.user_id)
      }

      toast.success(`Withdrawal ${action}`)
      fetchWithdrawals()
    } else {
      toast.error('Failed to process withdrawal')
    }
    setProcessingId(null)
  }

  async function completeWithdrawal(withdrawalId: string) {
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'completed' })
      .eq('id', withdrawalId)

    if (!error) {
      toast.success('Withdrawal marked as completed')
      fetchWithdrawals()
    }
  }

  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesSearch = w.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || w.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length
  const processingCount = withdrawals.filter(w => w.status === 'processing').length

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-accent-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Withdrawals</h1>
          <p className="text-gray-400 mt-1">Manage user withdrawal requests</p>
        </div>
        <div className="flex gap-3">
          {pendingCount > 0 && (
            <div className="glass rounded-xl px-4 py-2">
              <p className="text-yellow-400 text-sm font-medium">{pendingCount} Pending</p>
            </div>
          )}
          {processingCount > 0 && (
            <div className="glass rounded-xl px-4 py-2">
              <p className="text-blue-400 text-sm font-medium">{processingCount} Processing</p>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by user or withdrawal ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white placeholder-gray-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
        >
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Withdrawals Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-800/50 border-b border-primary-500/20">
              <tr>
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-left py-3 px-4">Details</th>
                <th className="text-left py-3 px-4">Fee</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="border-b border-primary-500/10 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <Link href={`/admin/users/${withdrawal.user_id}`} className="text-white hover:text-accent-500">
                      {withdrawal.profiles?.username || 'Unknown'}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-white">{withdrawal.amount_spy?.toLocaleString()} SPY</p>
                    <p className="text-xs text-gray-500">≈ ${withdrawal.amount_usd?.toLocaleString()}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="uppercase text-xs">{withdrawal.method}</span>
                  </td>
                  <td className="py-3 px-4">
                    {withdrawal.method === 'usdt' ? (
                      <p className="text-xs text-gray-400 truncate max-w-[150px]">{withdrawal.address}</p>
                    ) : (
                      <div className="text-xs text-gray-400">
                        <p>{withdrawal.bank_details?.bankName}</p>
                        <p>{withdrawal.bank_details?.accountNumber}</p>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-yellow-400">{withdrawal.fee_spy} SPY</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${
                      withdrawal.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      withdrawal.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                      withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {withdrawal.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                      {withdrawal.status === 'processing' && <Send className="w-3 h-3" />}
                      {withdrawal.status === 'pending' && <Clock className="w-3 h-3" />}
                      {withdrawal.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                      {withdrawal.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{new Date(withdrawal.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    {withdrawal.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => processWithdrawal(withdrawal.id, 'approved')}
                          disabled={processingId === withdrawal.id}
                          className="p-1.5 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => processWithdrawal(withdrawal.id, 'rejected')}
                          disabled={processingId === withdrawal.id}
                          className="p-1.5 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {withdrawal.status === 'processing' && (
                      <button
                        onClick={() => completeWithdrawal(withdrawal.id)}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30"
                      >
                        Mark Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
