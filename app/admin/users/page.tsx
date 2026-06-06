'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Filter, MoreVertical, UserCheck, UserX, Eye, Ban, Shield, Coins } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const supabase = createClient()

interface User {
  id: string
  username: string
  email: string
  spy_balance: number
  is_premium: boolean
  is_banned: boolean
  referral_count: number
  created_at: string
  last_active: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      setUsers(data)
    }
    setIsLoading(false)
  }

  async function toggleBan(userId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !currentStatus })
      .eq('id', userId)

    if (!error) {
      toast.success(`User ${currentStatus ? 'unbanned' : 'banned'} successfully`)
      fetchUsers()
    } else {
      toast.error('Failed to update user status')
    }
  }

  async function adjustBalance(userId: string, amount: number, reason: string) {
    const { data: user } = await supabase
      .from('profiles')
      .select('spy_balance')
      .eq('id', userId)
      .single()

    const newBalance = (user?.spy_balance || 0) + amount

    const { error } = await supabase
      .from('profiles')
      .update({ spy_balance: newBalance })
      .eq('id', userId)

    if (!error) {
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'admin_adjustment',
        amount_spy: amount,
        balance_before: user?.spy_balance || 0,
        balance_after: newBalance,
        metadata: { reason, admin: true }
      })

      toast.success(`Balance adjusted by ${amount} SPY`)
      setShowBalanceModal(false)
      setAdjustAmount('')
      setAdjustReason('')
      fetchUsers()
    } else {
      toast.error('Failed to adjust balance')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'premium' && user.is_premium) ||
      (filterStatus === 'banned' && user.is_banned) ||
      (filterStatus === 'active' && !user.is_banned)
    return matchesSearch && matchesFilter
  })

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
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1">Manage platform users</p>
        </div>
        <button className="px-4 py-2 glass rounded-lg text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white focus:outline-none focus:border-primary-500"
        >
          <option value="all">All Users</option>
          <option value="premium">Premium Only</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-800/50 border-b border-primary-500/20">
              <tr>
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Balance</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Referrals</th>
                <th className="text-left py-3 px-4">Joined</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-primary-500/10 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-white font-medium">{user.username || 'No username'}</p>
                      <p className="text-xs text-gray-500">{user.email || 'No email'}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-white">{user.spy_balance?.toLocaleString()} SPY</p>
                    <p className="text-xs text-gray-500">≈ ${((user.spy_balance || 0) / 100).toFixed(2)}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {user.is_premium && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">Premium</span>
                      )}
                      {user.is_banned && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">Banned</span>
                      )}
                      {!user.is_premium && !user.is_banned && (
                        <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full text-xs">Free</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-white">{user.referral_count || 0}</td>
                  <td className="py-3 px-4 text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Link href={`/admin/users/${user.id}`} className="p-1.5 hover:bg-white/10 rounded-lg transition">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowBalanceModal(true)
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition"
                      >
                        <Coins className="w-4 h-4 text-accent-500" />
                      </button>
                      <button
                        onClick={() => toggleBan(user.id, user.is_banned)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition"
                      >
                        {user.is_banned ? <UserCheck className="w-4 h-4 text-green-400" /> : <Ban className="w-4 h-4 text-red-400" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Balance Modal */}
      {showBalanceModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Adjust Balance</h2>
            <p className="text-gray-400 text-sm mb-4">User: <span className="text-white">{selectedUser.username}</span></p>
            <p className="text-gray-400 text-sm mb-4">Current Balance: <span className="text-accent-500">{selectedUser.spy_balance} SPY</span></p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Amount (+ or -)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g., 100 or -50"
                  className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Compensation, correction, etc."
                  className="w-full px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => adjustBalance(selectedUser.id, parseInt(adjustAmount) || 0, adjustReason)}
                  className="flex-1 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white"
                >
                  Apply
                </button>
                <button
                  onClick={() => setShowBalanceModal(false)}
                  className="flex-1 py-2 glass rounded-xl text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
