'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Search, CheckCircle, XCircle, Clock, Send,
  AlertCircle, Copy, ChevronDown, Filter, Shield,
  Wallet, TrendingUp, Ban, CheckCheck,
  Users, Eye, RefreshCw, AlertTriangle, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import './withdrawals.css'

const supabase = createClient()

type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected'

interface Withdrawal {
  id: string
  user_id: string
  amount_spy: number
  amount_usd: number
  fee_spy: number
  method: 'usdt' | 'bank'
  address: string | null
  bank_details: {
    bankName?: string
    accountNumber?: string
    accountName?: string
  } | null
  status: WithdrawalStatus
  admin_notes: string | null
  created_at: string
  processed_at: string | null
  profiles?: { username: string; email?: string }[]
}

interface UserStats {
  totalWithdrawn: number
  totalWithdrawals: number
  isBanned: boolean
  accountAge: number
}

const STATUS_CONFIG: Record<WithdrawalStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'yellow', icon: Clock },
  processing: { label: 'Processing', color: 'blue', icon: Send },
  completed: { label: 'Completed', color: 'green', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'red', icon: Ban },
}

// Map raw Postgres/RPC errors to friendly messages
function friendlyError(err: any): string {
  const msg = String(err?.message || err || '')
  if (msg.includes('NOT_ADMIN')) return 'You do not have permission to do that.'
  if (msg.includes('WITHDRAWAL_NOT_FOUND')) return 'This withdrawal no longer exists.'
  if (msg.includes('INVALID_STATUS')) {
    const s = msg.split(':')[1] || 'changed'
    return `Status already changed to "${s}". Refresh to see the latest state.`
  }
  if (msg.includes('USER_NOT_FOUND')) return 'User profile not found.'
  if (msg.includes('row-level security')) return 'Permission denied by database policy.'
  return 'Something went wrong. Please try again.'
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<WithdrawalStatus | 'all'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'complete' | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({})
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // ===== FETCH WITHDRAWALS =====
  const fetchWithdrawals = useCallback(async () => {
    try {
      setIsLoading(true)
      setRefreshing(true)
      setLoadError(null)

      const { data, error } = await supabase
        .from('withdrawals')
        .select('*, profiles!withdrawals_user_id_fkey(username, email)')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch error:', error)
        // Batch-enrich fallback (one query, not N+1)
        const { data: raw, error: rawErr } = await supabase
          .from('withdrawals')
          .select('*')
          .order('created_at', { ascending: false })

        if (rawErr) {
          setLoadError(friendlyError(rawErr))
          toast.error('Failed to load withdrawals')
          setWithdrawals([])
          return
        }

        const userIds = [...new Set((raw || []).map(w => w.user_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', userIds)

        const byId = new Map((profiles || []).map(p => [p.id, p]))
        const enriched = (raw || []).map((w: any) => ({
          ...w,
          profiles: byId.has(w.user_id) ? [byId.get(w.user_id)] : [],
        }))
        setWithdrawals(enriched)
      } else {
        setWithdrawals(data || [])
      }
    } catch (err: any) {
      console.error('Unexpected error:', err)
      setLoadError(friendlyError(err))
      toast.error('Failed to load withdrawals')
      setWithdrawals([])
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  // ===== FETCH USER STATS =====
  const fetchUserStats = useCallback(async (userId: string) => {
    if (userStats[userId]) return
    try {
      const [profileRes, withdrawalsRes] = await Promise.all([
        supabase.from('profiles').select('is_banned, created_at').eq('id', userId).single(),
        supabase.from('withdrawals').select('amount_spy, status').eq('user_id', userId),
      ])

      const profile = profileRes.data
      const userWithdrawals = withdrawalsRes.data || []
      const completed = userWithdrawals.filter(w => w.status === 'completed' || w.status === 'processing')
      const totalWithdrawn = completed.reduce((sum, w) => sum + (w.amount_spy || 0), 0)
      const accountAge = profile?.created_at
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)
        : 0

      setUserStats(prev => ({
        ...prev,
        [userId]: {
          totalWithdrawn,
          totalWithdrawals: userWithdrawals.length,
          isBanned: profile?.is_banned || false,
          accountAge,
        },
      }))
    } catch (err) {
      console.error('User stats error:', err)
    }
  }, [userStats])

  useEffect(() => { fetchWithdrawals() }, [fetchWithdrawals])

  // ===== RPC ACTIONS (atomic, guarded server-side) =====
  const runAction = async (
    id: string,
    action: 'approve' | 'reject' | 'complete'
  ) => {
    setProcessingId(id)
    setConfirmAction(null)
    try {
      const rpc =
        action === 'approve' ? 'approve_withdrawal'
        : action === 'reject' ? 'reject_withdrawal'
        : 'complete_withdrawal'

      const { error } = await supabase.rpc(rpc, { p_withdrawal_id: id })
      if (error) throw error

      toast.success(
        action === 'approve' ? '✅ Approved for processing'
        : action === 'reject' ? '❌ Rejected and refunded'
        : '✅ Marked as completed'
      )
      setSelectedWithdrawal(null)
      setShowDetailModal(false)
      // Invalidate cached stats for that user
      const w = withdrawals.find(x => x.id === id)
      if (w) setUserStats(prev => { const n = { ...prev }; delete n[w.user_id]; return n })
      await fetchWithdrawals()
    } catch (err: any) {
      console.error(`${action} error:`, err)
      toast.error(friendlyError(err))
      // Refresh so UI reflects actual server state after a race/failure
      await fetchWithdrawals()
    } finally {
      setProcessingId(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const openDetail = useCallback((withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setShowDetailModal(true)
    fetchUserStats(withdrawal.user_id)
  }, [fetchUserStats])

  // ===== DERIVED DATA =====
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return withdrawals.filter(w => {
      const username = w.profiles?.[0]?.username?.toLowerCase() || ''
      const email = w.profiles?.[0]?.email?.toLowerCase() || ''
      const matchesSearch =
        username.includes(q) || email.includes(q) ||
        w.id.toLowerCase().includes(q) ||
        (w.address && w.address.toLowerCase().includes(q))
      const matchesFilter = filterStatus === 'all' || w.status === filterStatus
      return matchesSearch && matchesFilter
    })
  }, [withdrawals, searchTerm, filterStatus])

  const stats = useMemo(() => ({
    pending: withdrawals.filter(w => w.status === 'pending').length,
    processing: withdrawals.filter(w => w.status === 'processing').length,
    completed: withdrawals.filter(w => w.status === 'completed').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
    totalVolume: withdrawals
      .filter(w => w.status === 'completed' || w.status === 'processing')
      .reduce((s, w) => s + w.amount_spy, 0),
    pendingVolume: withdrawals
      .filter(w => w.status === 'pending')
      .reduce((s, w) => s + w.amount_spy, 0),
  }), [withdrawals])

  if (isLoading) {
    return (
      <div className="wd-loading">
        <div className="wd-loading-spinner" />
        <p>Loading withdrawals...</p>
      </div>
    )
  }

  return (
    <div className="wd-page">
      <div className="wd-header">
        <div className="wd-header-left">
          <div className="wd-header-badge">
            <Shield size={14} />
            <span>Financial Control</span>
          </div>
          <h1 className="wd-title">Withdrawals</h1>
          <p className="wd-subtitle">Review, approve, and process withdrawal requests</p>
        </div>
        <div className="wd-header-right">
          <button onClick={fetchWithdrawals} disabled={refreshing} className="wd-btn-refresh">
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="wd-alert wd-alert-error">
          <AlertCircle size={18} />
          <div>
            <strong>Failed to load withdrawals</strong>
            <span>{loadError}</span>
          </div>
          <button onClick={fetchWithdrawals} className="wd-alert-retry">Retry</button>
        </div>
      )}

      {stats.pending > 0 && !loadError && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="wd-alert">
          <AlertTriangle size={18} />
          <div>
            <strong>{stats.pending} withdrawal{stats.pending > 1 ? 's' : ''} pending review</strong>
            <span>Total: {stats.pendingVolume.toLocaleString()} SPY</span>
          </div>
        </motion.div>
      )}

      <div className="wd-stats">
        {[
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'yellow' },
          { label: 'Processing', value: stats.processing, icon: Send, color: 'blue' },
          { label: 'Completed', value: stats.completed, icon: CheckCheck, color: 'green' },
          { label: 'Total Volume', value: `${stats.totalVolume.toLocaleString()} SPY`, icon: TrendingUp, color: 'purple' },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`wd-stat-card wd-stat-${s.color}`}
          >
            <div className="wd-stat-bg" />
            <div className={`wd-stat-icon wd-stat-icon-${s.color}`}>
              <s.icon size={20} />
            </div>
            <div className="wd-stat-content">
              <p className="wd-stat-value">{s.value}</p>
              <p className="wd-stat-label">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="wd-toolbar">
        <div className="wd-search">
          <Search className="wd-search-icon" size={18} />
          <input
            type="text"
            placeholder="Search by username, email, ID, or wallet address..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="wd-search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="wd-search-clear">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`wd-filter-btn ${showFilters ? 'active' : ''}`}
        >
          <Filter size={16} />
          <span>Filters</span>
          <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="wd-filter-chips"
          >
            {(['all', 'pending', 'processing', 'completed', 'rejected'] as const).map(status => {
              const count = status === 'all' ? withdrawals.length : withdrawals.filter(w => w.status === status).length
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`wd-chip ${filterStatus === status ? 'active' : ''}`}
                >
                  {status === 'all' ? 'All Statuses' : STATUS_CONFIG[status as WithdrawalStatus].label}
                  <span className="wd-chip-count">{count}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="wd-results">
        <span>{filtered.length} withdrawal{filtered.length !== 1 ? 's' : ''} found</span>
      </div>

      <div className="wd-table-wrap">
        {filtered.length === 0 ? (
          <div className="wd-empty">
            <Wallet size={48} className="wd-empty-icon" />
            <h3>No withdrawals found</h3>
            <p>{loadError ? 'Fix the error above and retry' : 'Try adjusting your search or filters'}</p>
          </div>
        ) : (
          <div className="wd-table-scroll">
            <table className="wd-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Destination</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w, idx) => {
                  const statusConfig = STATUS_CONFIG[w.status]
                  const StatusIcon = statusConfig.icon
                  const username = w.profiles?.[0]?.username || 'Unknown'
                  const us = userStats[w.user_id]

                  return (
                    <motion.tr
                      key={w.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`wd-row ${us?.isBanned ? 'wd-row-banned' : ''}`}
                    >
                      <td>
                        <Link href={`/admin/users/${w.user_id}`} className="wd-user">
                          <div className="wd-user-avatar">
                            {username[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="wd-user-info">
                            <span className="wd-user-name">{username}</span>
                            {us?.isBanned && (
                              <span className="wd-user-banned"><Ban size={10} /> BANNED</span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td>
                        <div className="wd-amount">
                          <span className="wd-amount-spy">{w.amount_spy.toLocaleString()} SPY</span>
                          <span className="wd-amount-usd">≈ ${w.amount_usd?.toFixed(2)}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`wd-method wd-method-${w.method}`}>{w.method.toUpperCase()}</span>
                      </td>
                      <td>
                        {w.method === 'usdt' && w.address ? (
                          <div className="wd-dest">
                            <span className="wd-dest-text">
                              {w.address.slice(0, 10)}...{w.address.slice(-6)}
                            </span>
                            <button onClick={() => copyToClipboard(w.address!)} className="wd-copy" title="Copy address">
                              <Copy size={12} />
                            </button>
                          </div>
                        ) : w.bank_details ? (
                          <div className="wd-bank">
                            <p className="wd-bank-name">{w.bank_details.bankName}</p>
                            <p className="wd-bank-acct">{w.bank_details.accountNumber}</p>
                          </div>
                        ) : (
                          <span className="wd-dest-text">—</span>
                        )}
                      </td>
                      <td><span className="wd-fee">{w.fee_spy} SPY</span></td>
                      <td>
                        <span className={`wd-status wd-status-${statusConfig.color}`}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td>
                        <span className="wd-date">
                          {new Date(w.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td>
                        <div className="wd-actions">
                          <button onClick={() => openDetail(w)} className="wd-action-btn wd-action-view" title="View details">
                            <Eye size={14} />
                          </button>
                          {w.status === 'pending' && (
                            <>
                              <button
                                onClick={() => { setSelectedWithdrawal(w); setConfirmAction('approve') }}
                                disabled={processingId === w.id}
                                className="wd-action-btn wd-action-approve"
                                title="Approve"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => { setSelectedWithdrawal(w); setConfirmAction('reject') }}
                                disabled={processingId === w.id}
                                className="wd-action-btn wd-action-reject"
                                title="Reject & Refund"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {w.status === 'processing' && (
                            <button
                              onClick={() => { setSelectedWithdrawal(w); setConfirmAction('complete') }}
                              disabled={processingId === w.id}
                              className="wd-action-btn wd-action-complete"
                              title="Mark as completed"
                            >
                              <CheckCheck size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {showDetailModal && selectedWithdrawal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="wd-modal-overlay"
            onClick={() => { setShowDetailModal(false); setSelectedWithdrawal(null) }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="wd-modal wd-modal-detail"
              onClick={e => e.stopPropagation()}
            >
              <div className="wd-modal-header">
                <h3>Withdrawal Details</h3>
                <button
                  onClick={() => { setShowDetailModal(false); setSelectedWithdrawal(null) }}
                  className="wd-modal-close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="wd-modal-body">
                <div className="wd-detail-status">
                  <span className={`wd-status wd-status-${STATUS_CONFIG[selectedWithdrawal.status].color}`}>
                    {(() => {
                      const Icon = STATUS_CONFIG[selectedWithdrawal.status].icon
                      return <Icon size={16} />
                    })()}
                    {STATUS_CONFIG[selectedWithdrawal.status].label}
                  </span>
                </div>

                <div className="wd-detail-amount">
                  <p className="wd-detail-label">Amount</p>
                  <p className="wd-detail-value">{selectedWithdrawal.amount_spy.toLocaleString()} SPY</p>
                  <p className="wd-detail-usd">≈ ${selectedWithdrawal.amount_usd?.toFixed(2)} USD</p>
                </div>

                <div className="wd-detail-grid">
                  <div className="wd-detail-item">
                    <span className="wd-detail-label-sm">Method</span>
                    <span className="wd-detail-value-sm">{selectedWithdrawal.method.toUpperCase()}</span>
                  </div>
                  <div className="wd-detail-item">
                    <span className="wd-detail-label-sm">Fee</span>
                    <span className="wd-detail-value-sm">{selectedWithdrawal.fee_spy} SPY</span>
                  </div>
                  <div className="wd-detail-item">
                    <span className="wd-detail-label-sm">Net Amount</span>
                    <span className="wd-detail-value-sm">
                      {(selectedWithdrawal.amount_spy - selectedWithdrawal.fee_spy).toLocaleString()} SPY
                    </span>
                  </div>
                  <div className="wd-detail-item">
                    <span className="wd-detail-label-sm">Requested</span>
                    <span className="wd-detail-value-sm">
                      {new Date(selectedWithdrawal.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {userStats[selectedWithdrawal.user_id] && (
                  <div className="wd-detail-section">
                    <h4 className="wd-detail-section-title"><Users size={14} /> User Analytics</h4>
                    <div className="wd-detail-grid">
                      <div className="wd-detail-item">
                        <span className="wd-detail-label-sm">Total Withdrawn</span>
                        <span className="wd-detail-value-sm">
                          {userStats[selectedWithdrawal.user_id].totalWithdrawn.toLocaleString()} SPY
                        </span>
                      </div>
                      <div className="wd-detail-item">
                        <span className="wd-detail-label-sm">Total Requests</span>
                        <span className="wd-detail-value-sm">
                          {userStats[selectedWithdrawal.user_id].totalWithdrawals}
                        </span>
                      </div>
                      <div className="wd-detail-item">
                        <span className="wd-detail-label-sm">Account Age</span>
                        <span className="wd-detail-value-sm">
                          {userStats[selectedWithdrawal.user_id].accountAge} days
                        </span>
                      </div>
                      <div className="wd-detail-item">
                        <span className="wd-detail-label-sm">Status</span>
                        <span className={`wd-detail-value-sm ${userStats[selectedWithdrawal.user_id].isBanned ? 'text-red-400' : 'text-green-400'}`}>
                          {userStats[selectedWithdrawal.user_id].isBanned ? '⚠️ Banned' : '✓ Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedWithdrawal.method === 'usdt' && selectedWithdrawal.address && (
                  <div className="wd-detail-section">
                    <h4 className="wd-detail-section-title">Destination Address</h4>
                    <div className="wd-detail-address">
                      <code>{selectedWithdrawal.address}</code>
                      <button onClick={() => copyToClipboard(selectedWithdrawal.address!)} className="wd-copy-btn">
                        <Copy size={14} /> Copy
                      </button>
                    </div>
                  </div>
                )}

                {selectedWithdrawal.bank_details && (
                  <div className="wd-detail-section">
                    <h4 className="wd-detail-section-title">Bank Details</h4>
                    <div className="wd-detail-bank">
                      <div className="wd-detail-item">
                        <span className="wd-detail-label-sm">Bank</span>
                        <span className="wd-detail-value-sm">{selectedWithdrawal.bank_details.bankName}</span>
                      </div>
                      <div className="wd-detail-item">
                        <span className="wd-detail-label-sm">Account Number</span>
                        <span className="wd-detail-value-sm">{selectedWithdrawal.bank_details.accountNumber}</span>
                      </div>
                      <div className="wd-detail-item">
                        <span className="wd-detail-label-sm">Account Name</span>
                        <span className="wd-detail-value-sm">{selectedWithdrawal.bank_details.accountName}</span>
                      </div>
                    </div>
                  </div>
                )}

                {userStats[selectedWithdrawal.user_id]?.isBanned && (
                  <div className="wd-security-alert">
                    <AlertTriangle size={16} />
                    <div>
                      <strong>⚠️ Security Alert</strong>
                      <p>This user is banned. Reject and investigate before processing.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="wd-modal-footer">
                <button
                  onClick={() => { setShowDetailModal(false); setSelectedWithdrawal(null) }}
                  className="wd-modal-btn wd-modal-btn-cancel"
                >
                  Close
                </button>
                {selectedWithdrawal.status === 'pending' && (
                  <>
                    <button
                      onClick={() => { setShowDetailModal(false); setConfirmAction('reject') }}
                      className="wd-modal-btn wd-modal-btn-reject"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                    <button
                      onClick={() => { setShowDetailModal(false); setConfirmAction('approve') }}
                      className="wd-modal-btn wd-modal-btn-approve"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                  </>
                )}
                {selectedWithdrawal.status === 'processing' && (
                  <button
                    onClick={() => { setShowDetailModal(false); setConfirmAction('complete') }}
                    className="wd-modal-btn wd-modal-btn-approve"
                  >
                    <CheckCheck size={16} /> Complete
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM MODAL */}
      <AnimatePresence>
        {confirmAction && selectedWithdrawal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="wd-modal-overlay"
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="wd-modal wd-modal-confirm"
              onClick={e => e.stopPropagation()}
            >
              <div className={`wd-confirm-icon wd-confirm-icon-${confirmAction}`}>
                {confirmAction === 'approve' && <CheckCircle size={32} />}
                {confirmAction === 'reject' && <AlertCircle size={32} />}
                {confirmAction === 'complete' && <CheckCheck size={32} />}
              </div>

              <h3 className="wd-confirm-title">
                {confirmAction === 'approve' && 'Approve Withdrawal?'}
                {confirmAction === 'reject' && 'Reject & Refund?'}
                {confirmAction === 'complete' && 'Mark as Completed?'}
              </h3>

              <p className="wd-confirm-desc">
                {confirmAction === 'approve' && (
                  <>Approve <strong>{selectedWithdrawal.amount_spy.toLocaleString()} SPY</strong> withdrawal for <strong>{selectedWithdrawal.profiles?.[0]?.username || 'user'}</strong>? The user will be notified and funds sent.</>
                )}
                {confirmAction === 'reject' && (
                  <>Reject and refund <strong>{selectedWithdrawal.amount_spy.toLocaleString()} SPY</strong> back to <strong>{selectedWithdrawal.profiles?.[0]?.username || 'user'}</strong>? This cannot be undone.</>
                )}
                {confirmAction === 'complete' && (
                  <>Mark <strong>{selectedWithdrawal.amount_spy.toLocaleString()} SPY</strong> withdrawal as completed? Only do this after the funds have been sent.</>
                )}
              </p>

              <div className="wd-confirm-actions">
                <button onClick={() => setConfirmAction(null)} className="wd-modal-btn wd-modal-btn-cancel">
                  Cancel
                </button>
                <button
                  onClick={() => runAction(selectedWithdrawal.id, confirmAction)}
                  disabled={processingId === selectedWithdrawal.id}
                  className={`wd-modal-btn wd-modal-btn-${confirmAction === 'reject' ? 'reject' : 'approve'}`}
                >
                  {processingId === selectedWithdrawal.id ? (
                    <div className="wd-spinner" />
                  ) : (
                    <>
                      {confirmAction === 'approve' && 'Yes, Approve'}
                      {confirmAction === 'reject' && 'Yes, Reject & Refund'}
                      {confirmAction === 'complete' && 'Yes, Complete'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
