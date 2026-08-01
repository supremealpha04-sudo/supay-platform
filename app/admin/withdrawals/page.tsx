'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Search, CheckCircle, XCircle, Clock, Send,
  AlertCircle, Copy, ChevronDown, Filter,
  ArrowUpRight, Wallet, TrendingUp, Ban, CheckCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import './page.css'

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
  profiles?: { username: string }[]
}

const STATUS_CONFIG: Record<WithdrawalStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'yellow', icon: Clock },
  processing: { label: 'Processing', color: 'blue', icon: Send },
  completed: { label: 'Completed', color: 'green', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'red', icon: Ban },
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<WithdrawalStatus | 'all'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null)

  const fetchWithdrawals = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load withdrawals')
      console.error(error)
    } else {
      setWithdrawals(data || [])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchWithdrawals()
  }, [fetchWithdrawals])

  const processWithdrawal = async (withdrawalId: string, action: 'approved' | 'rejected') => {
    setProcessingId(withdrawalId)
    setConfirmAction(null)
    setSelectedWithdrawal(null)

    const { error } = await supabase
      .from('withdrawals')
      .update({
        status: action === 'approved' ? 'processing' : 'rejected',
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId)

    if (error) {
      toast.error('Failed to process withdrawal')
      setProcessingId(null)
      return
    }

    const withdrawal = withdrawals.find(w => w.id === withdrawalId)

    if (action === 'rejected' && withdrawal) {
      const { data: user } = await supabase
        .from('profiles')
        .select('spy_balance')
        .eq('id', withdrawal.user_id)
        .single()

      await supabase
        .from('profiles')
        .update({ spy_balance: (user?.spy_balance || 0) + withdrawal.amount_spy })
        .eq('id', withdrawal.user_id)

      await supabase.from('transactions').insert({
        user_id: withdrawal.user_id,
        type: 'withdrawal_refund',
        amount_spy: withdrawal.amount_spy,
        balance_before: user?.spy_balance || 0,
        balance_after: (user?.spy_balance || 0) + withdrawal.amount_spy,
        metadata: { withdrawal_id: withdrawalId, reason: 'Rejected by admin' },
      })
    }

    toast.success(`Withdrawal ${action === 'approved' ? 'approved' : 'rejected'}`)
    fetchWithdrawals()
    setProcessingId(null)
  }

  const completeWithdrawal = async (withdrawalId: string) => {
    setProcessingId(withdrawalId)
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'completed', processed_at: new Date().toISOString() })
      .eq('id', withdrawalId)

    if (error) {
      toast.error('Failed to complete withdrawal')
    } else {
      toast.success('Withdrawal marked as completed')
      fetchWithdrawals()
    }
    setProcessingId(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const filtered = withdrawals.filter(w => {
    const username = w.profiles?.[0]?.username?.toLowerCase() || ''
    const matchesSearch =
      username.includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.address && w.address.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterStatus === 'all' || w.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    pending: withdrawals.filter(w => w.status === 'pending').length,
    processing: withdrawals.filter(w => w.status === 'processing').length,
    completed: withdrawals.filter(w => w.status === 'completed').length,
    totalVolume: withdrawals
      .filter(w => w.status === 'completed' || w.status === 'processing')
      .reduce((s, w) => s + w.amount_spy, 0),
  }

  if (isLoading) {
    return (
      <div className="withdrawals-loading">
        <div className="withdrawals-spinner" />
        <p>Loading withdrawals...</p>
      </div>
    )
  }

  return (
    <div className="withdrawals-container">
      {/* Header */}
      <div className="withdrawals-header">
        <div>
          <h1 className="withdrawals-title">Withdrawals</h1>
          <p className="withdrawals-subtitle">Review and process user withdrawal requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="withdrawals-stats">
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
            transition={{ delay: i * 0.08 }}
            className="withdrawals-stat-card"
          >
            <div className={`withdrawals-stat-icon withdrawals-stat-icon-${s.color}`}>
              <s.icon />
            </div>
            <div>
              <p className="withdrawals-stat-value">{s.value}</p>
              <p className="withdrawals-stat-label">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="withdrawals-toolbar">
        <div className="withdrawals-search">
          <Search className="withdrawals-search-icon" />
          <input
            type="text"
            placeholder="Search by user, ID, or address..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="withdrawals-search-input"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`withdrawals-filter-btn ${showFilters ? 'active' : ''}`}
        >
          <Filter /> Filters <ChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filter Chips */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="withdrawals-filter-chips"
          >
            {(['all', 'pending', 'processing', 'completed', 'rejected'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`withdrawals-chip ${filterStatus === status ? 'active' : ''}`}
              >
                {status === 'all' ? 'All Statuses' : STATUS_CONFIG[status as WithdrawalStatus].label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="withdrawals-table-wrap">
        {filtered.length === 0 ? (
          <div className="withdrawals-empty">
            <Wallet className="withdrawals-empty-icon" />
            <p>No withdrawals found</p>
            <span>Try adjusting your search or filters</span>
          </div>
        ) : (
          <div className="withdrawals-table-scroll">
            <table className="withdrawals-table">
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

                  return (
                    <motion.tr
                      key={w.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="withdrawals-row"
                    >
                      <td>
                        <Link href={`/admin/users/${w.user_id}`} className="withdrawals-user">
                          <div className="withdrawals-user-avatar">{username[0]?.toUpperCase() || 'U'}</div>
                          <span className="withdrawals-user-name">{username}</span>
                        </Link>
                      </td>
                      <td>
                        <div className="withdrawals-amount">
                          <span className="withdrawals-amount-spy">{w.amount_spy.toLocaleString()} SPY</span>
                          <span className="withdrawals-amount-usd">≈ ${w.amount_usd?.toLocaleString()}</span>
                        </div>
                      </td>
                      <td>
                        <span className="withdrawals-method">{w.method}</span>
                      </td>
                      <td>
                        {w.method === 'usdt' && w.address ? (
                          <div className="withdrawals-dest">
                            <span className="withdrawals-dest-text">{w.address.slice(0, 12)}...{w.address.slice(-8)}</span>
                            <button onClick={() => copyToClipboard(w.address!)} className="withdrawals-copy">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : w.bank_details ? (
                          <div className="withdrawals-bank">
                            <p>{w.bank_details.bankName}</p>
                            <p>{w.bank_details.accountNumber}</p>
                          </div>
                        ) : (
                          <span className="withdrawals-dest-text">—</span>
                        )}
                      </td>
                      <td>
                        <span className="withdrawals-fee">{w.fee_spy} SPY</span>
                      </td>
                      <td>
                        <span className={`withdrawals-status-badge withdrawals-status-${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td>
                        <span className="withdrawals-date">
                          {new Date(w.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td>
                        {w.status === 'pending' && (
                          <div className="withdrawals-actions">
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w)
                                setConfirmAction('approve')
                              }}
                              disabled={processingId === w.id}
                              className="withdrawals-btn withdrawals-btn-approve"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w)
                                setConfirmAction('reject')
                              }}
                              disabled={processingId === w.id}
                              className="withdrawals-btn withdrawals-btn-reject"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {w.status === 'processing' && (
                          <button
                            onClick={() => completeWithdrawal(w.id)}
                            disabled={processingId === w.id}
                            className="withdrawals-btn withdrawals-btn-complete"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            Complete
                          </button>
                        )}
                        {w.status === 'completed' && (
                          <span className="withdrawals-done">
                            <CheckCheck className="w-4 h-4" /> Done
                          </span>
                        )}
                        {w.status === 'rejected' && (
                          <span className="withdrawals-done withdrawals-done-rejected">
                            <Ban className="w-4 h-4" /> Refunded
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && selectedWithdrawal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="withdrawals-modal-overlay"
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="withdrawals-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="withdrawals-modal-icon">
                {confirmAction === 'approve' ? (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-400" />
                )}
              </div>
              <h3 className="withdrawals-modal-title">
                {confirmAction === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
              </h3>
              <p className="withdrawals-modal-desc">
                {confirmAction === 'approve'
                  ? `Approve ${selectedWithdrawal.amount_spy.toLocaleString()} SPY withdrawal for ${selectedWithdrawal.profiles?.[0]?.username || 'user'}?`
                  : `Reject and refund ${selectedWithdrawal.amount_spy.toLocaleString()} SPY to ${selectedWithdrawal.profiles?.[0]?.username || 'user'}?`}
              </p>
              <div className="withdrawals-modal-actions">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="withdrawals-modal-btn withdrawals-modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={() => processWithdrawal(selectedWithdrawal.id, confirmAction === 'approve' ? 'approved' : 'rejected')}
                  disabled={processingId === selectedWithdrawal.id}
                  className={`withdrawals-modal-btn ${confirmAction === 'approve' ? 'withdrawals-modal-btn-approve' : 'withdrawals-modal-btn-reject'}`}
                >
                  {processingId === selectedWithdrawal.id ? (
                    <div className="withdrawals-modal-spinner" />
                  ) : (
                    confirmAction === 'approve' ? 'Yes, Approve' : 'Yes, Reject & Refund'
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
