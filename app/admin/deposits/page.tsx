
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const supabase = createClient()

interface Deposit {
  id: string
  user_id: string
  amount_usd: number
  amount_ngn: number
  spy_expected: number
  method: string
  status: string
  created_at: string
  profiles: { username: string }
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchDeposits()
  }, [])

  async function fetchDeposits() {
    const { data, error } = await supabase
      .from('deposits')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setDeposits(data)
    }
    setIsLoading(false)
  }

  async function verifyDeposit(depositId: string, status: 'completed' | 'rejected') {
    const { error } = await supabase
      .from('deposits')
      .update({ status, confirmed_at: new Date().toISOString() })
      .eq('id', depositId)

    if (!error) {
      if (status === 'completed') {
        // Get deposit details
        const deposit = deposits.find(d => d.id === depositId)
        if (deposit) {
          // Update user balance
          const { data: user } = await supabase
            .from('profiles')
            .select('spy_balance')
            .eq('id', deposit.user_id)
            .single()

          await supabase
            .from('profiles')
            .update({ spy_balance: (user?.spy_balance || 0) + deposit.spy_expected })
            .eq('id', deposit.user_id)

          // Update breakdown
          await supabase
            .from('user_spy_breakdown')
            .update({ deposited_spy: supabase.rpc('increment', { x: deposit.spy_expected }) })
            .eq('user_id', deposit.user_id)

          // Send notification
          await supabase.from('notifications').insert({
            user_id: deposit.user_id,
            title: '✅ Deposit Verified!',
            message: `Your deposit of $${deposit.amount_usd} has been verified. ${deposit.spy_expected} SPY added to your balance.`,
            type: 'success'
          })
        }
      }
      toast.success(`Deposit ${status}`)
      fetchDeposits()
    }
  }

  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch = deposit.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          deposit.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || deposit.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const pendingCount = deposits.filter(d => d.status === 'pending').length

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
          <h1 className="text-3xl font-bold text-white">Deposits</h1>
          <p className="text-gray-400 mt-1">Manage user deposits</p>
        </div>
        {pendingCount > 0 && (
          <div className="glass rounded-xl px-4 py-2">
            <p className="text-yellow-400 text-sm font-medium">{pendingCount} Pending</p>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by user or deposit ID..."
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
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Deposits Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-800/50 border-b border-primary-500/20">
              <tr>
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-left py-3 px-4">SPY Expected</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeposits.map((deposit) => (
                <tr key={deposit.id} className="border-b border-primary-500/10 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <Link href={`/admin/users/${deposit.user_id}`} className="text-white hover:text-accent-500">
                      {deposit.profiles?.username || 'Unknown'}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-white">${deposit.amount_usd?.toLocaleString()}</p>
                    {deposit.amount_ngn && <p className="text-xs text-gray-500">₦{deposit.amount_ngn?.toLocaleString()}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize">{deposit.method}</span>
                  </td>
                  <td className="py-3 px-4 text-white">{deposit.spy_expected?.toLocaleString()} SPY</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${
                      deposit.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      deposit.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {deposit.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                      {deposit.status === 'pending' && <Clock className="w-3 h-3" />}
                      {deposit.status === 'failed' && <XCircle className="w-3 h-3" />}
                      {deposit.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{new Date(deposit.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    {deposit.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => verifyDeposit(deposit.id, 'completed')}
                          className="p-1.5 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => verifyDeposit(deposit.id, 'rejected')}
                          className="p-1.5 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
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
