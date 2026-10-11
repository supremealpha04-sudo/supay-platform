'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  FaSearch, FaEye, FaBan, FaUserCheck, FaCoins, 
  FaShieldAlt, FaTimes, FaUsers, FaDownload
} from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'
import './users.css'

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

  const fetchUsers = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const toggleBan = useCallback(async (userId: string, currentStatus: boolean) => {
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
  }, [fetchUsers])

  const adjustBalance = useCallback(async (userId: string, amount: number, reason: string) => {
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
  }, [fetchUsers])

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
      <div className="admin-user-detail-loading">
        <div className="admin-user-detail-loading-spinner" />
      </div>
    )
  }

  return (
    <div className="admin-users-page">
      {/* Header */}
      <div className="admin-users-header">
        <div className="admin-users-header-left">
          <h1>Users</h1>
          <p>Manage platform users</p>
        </div>
        <button className="admin-users-export-btn">
          <FaShieldAlt /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="admin-users-filters">
        <div className="admin-users-search">
          <FaSearch className="admin-users-search-icon" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-users-search-input"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="admin-users-filter-select"
        >
          <option value="all">All Users</option>
          <option value="premium">Premium Only</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="admin-users-table-wrapper">
        <div className="admin-users-table-scroll">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Referrals</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="admin-users-user-cell">
                      <div className="admin-users-avatar">
                        {user.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="admin-users-user-info">
                        <p className="admin-users-username">{user.username || 'No username'}</p>
                        <p className="admin-users-email">{user.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-users-balance">
                      {user.spy_balance?.toLocaleString()} SPY
                      <span className="admin-users-balance-usd">
                        ≈ ${((user.spy_balance || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-users-status">
                      {user.is_premium && (
                        <span className="admin-users-badge admin-users-badge-premium">Premium</span>
                      )}
                      {user.is_banned && (
                        <span className="admin-users-badge admin-users-badge-banned">Banned</span>
                      )}
                      {!user.is_premium && !user.is_banned && (
                        <span className="admin-users-badge admin-users-badge-free">Free</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="admin-users-referrals">{user.referral_count || 0}</span>
                  </td>
                  <td>
                    <span className="admin-users-date">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <div className="admin-users-actions">
                      <Link 
                        href={`/admin/users/${user.id}`} 
                        className="admin-users-action-btn view"
                        title="View user"
                      >
                        <FaEye />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowBalanceModal(true)
                        }}
                        className="admin-users-action-btn coins"
                        title="Adjust balance"
                      >
                        <FaCoins />
                      </button>
                      <button
                        onClick={() => toggleBan(user.id, user.is_banned)}
                        className={`admin-users-action-btn ${user.is_banned ? 'unban' : 'ban'}`}
                        title={user.is_banned ? 'Unban user' : 'Ban user'}
                      >
                        {user.is_banned ? <FaUserCheck /> : <FaBan />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="admin-users-empty">
            <FaUsers />
            <h3>No users found</h3>
            <p>Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* Adjust Balance Modal */}
      {showBalanceModal && selectedUser && (
        <div 
          className="admin-users-modal-overlay"
          onClick={() => setShowBalanceModal(false)}
        >
          <div 
            className="admin-users-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-users-modal-title">Adjust Balance</h2>
            
            <div className="admin-users-modal-info">
              <div className="admin-users-modal-info-row">
                <span className="admin-users-modal-info-label">User</span>
                <span className="admin-users-modal-info-value">{selectedUser.username}</span>
              </div>
              <div className="admin-users-modal-info-row">
                <span className="admin-users-modal-info-label">Current Balance</span>
                <span className="admin-users-modal-info-value accent">
                  {selectedUser.spy_balance?.toLocaleString()} SPY
                </span>
              </div>
            </div>

            <div className="admin-users-modal-field">
              <label>Amount (+ or -)</label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="e.g., 100 or -50"
                className="admin-users-modal-input"
              />
            </div>

            <div className="admin-users-modal-field">
              <label>Reason</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Compensation, correction, etc."
                className="admin-users-modal-input"
              />
            </div>

            <div className="admin-users-modal-actions">
              <button
                onClick={() => adjustBalance(
                  selectedUser.id, 
                  parseInt(adjustAmount) || 0, 
                  adjustReason
                )}
                className="admin-users-modal-btn apply"
              >
                Apply
              </button>
              <button
                onClick={() => setShowBalanceModal(false)}
                className="admin-users-modal-btn cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
