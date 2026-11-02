// app/dashboard/wallet/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaWallet, FaArrowUp, FaArrowDown, FaClock, FaBitcoin, FaSpinner,
  FaExclamationTriangle, FaEye, FaEyeSlash, FaPaperPlane,
  FaHistory, FaCoins, FaTimes, FaLock, FaTrashAlt,
} from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'
import styles from './page.module.css'

const supabase = createClient()

// ===== TYPES =====
interface Transaction {
  id: string
  user_id: string
  type: string
  amount_spy: number
  balance_after: number | null
  status: string
  created_at: string
  description?: string | null
  hidden_by_user?: boolean | null
  related_withdrawal_id?: string | null
}

// ===== CONSTANTS =====
const SPY_TO_USD = 0.01
const MINIMUM_WITHDRAW_SPY = 200
const WITHDRAW_FEE_PERCENT = 2
const WITHDRAW_FEE_MIN_SPY = 10
const MAX_WITHDRAW_SPY = 500_000
const TX_PAGE_LIMIT = 50

// ===== HELPERS =====
const safeNum = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const formatSpy = (v: unknown): string =>
  safeNum(v).toLocaleString('en-US', { maximumFractionDigits: 4 })

const formatUsd = (v: unknown): string =>
  safeNum(v).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export default function WalletPage() {
  const { profile, refreshProfile, isLoading: authLoading } = useAuth()

  // ===== STATE =====
  const [showBalance, setShowBalance] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  // Guard against concurrent transaction fetches
  const fetchInflight = useRef(false)

  // ===== COMPUTED =====
  const spyBalance = safeNum(profile?.spy_balance)
  const spyHeld = safeNum((profile as any)?.spy_held)
  const totalSpy = spyBalance + spyHeld
  const usdBalance = spyBalance * SPY_TO_USD
  const usdHeld = spyHeld * SPY_TO_USD

  const walletAddress: string | null = (profile as any)?.wallet_address || null

  const withdrawAmountNum = useMemo(
    () => parseFloat(withdrawAmount) || 0,
    [withdrawAmount]
  )

  const withdrawFee = useMemo(() => {
    if (withdrawAmountNum <= 0) return 0
    return Math.max(
      Math.ceil(withdrawAmountNum * (WITHDRAW_FEE_PERCENT / 100)),
      WITHDRAW_FEE_MIN_SPY
    )
  }, [withdrawAmountNum])

  const withdrawFinalAmount = useMemo(
    () => Math.max(withdrawAmountNum - withdrawFee, 0),
    [withdrawAmountNum, withdrawFee]
  )

  const isWithdrawValid = useMemo(
    () =>
      withdrawAmountNum >= MINIMUM_WITHDRAW_SPY &&
      withdrawAmountNum <= MAX_WITHDRAW_SPY &&
      withdrawAmountNum <= spyBalance &&
      withdrawAddress.trim().length > 10,
    [withdrawAmountNum, spyBalance, withdrawAddress]
  )

  // Visible activity = completed & not hidden
  const completedTx = useMemo(
    () =>
      transactions.filter(
        (t) => t.status === 'completed' && !t.hidden_by_user
      ),
    [transactions]
  )

  const pendingTx = useMemo(
    () => transactions.filter((t) => t.status === 'pending'),
    [transactions]
  )

  // ===== FETCH TRANSACTIONS =====
  const fetchTransactions = useCallback(async (opts?: { silent?: boolean }) => {
    if (!profile?.id) return
    if (fetchInflight.current) return
    fetchInflight.current = true

    if (!opts?.silent) setRefreshing(true)

    try {
      const { data, error: fetchErr } = await supabase
        .from('transactions')
        .select(
          'id, user_id, type, amount_spy, balance_after, status, created_at, description, hidden_by_user, related_withdrawal_id'
        )
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(TX_PAGE_LIMIT)

      if (fetchErr) {
        console.error('transactions fetch error:', fetchErr)
        setError('Failed to load transactions')
        return
      }

      // Defensive: normalise numeric fields
      const normalised: Transaction[] = (data || []).map((t) => ({
        ...t,
        amount_spy: safeNum(t.amount_spy),
        balance_after:
          t.balance_after === null || t.balance_after === undefined
            ? null
            : safeNum(t.balance_after),
        hidden_by_user: Boolean(t.hidden_by_user),
        status: t.status || 'completed',
      }))

      setTransactions(normalised)
      setLastSyncedAt(new Date())
      setError(null)
    } catch (e) {
      console.error('Unexpected transactions error:', e)
      setError('Failed to load transactions')
    } finally {
      fetchInflight.current = false
      if (!opts?.silent) setRefreshing(false)
    }
  }, [profile?.id])

  const fetchAllData = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      await Promise.all([
        fetchTransactions({ silent: true }),
        refreshProfile(),
      ])
    } catch {
      setError('Failed to load wallet data')
    } finally {
      setRefreshing(false)
    }
  }, [fetchTransactions, refreshProfile])

  // Initial load
  useEffect(() => {
    if (profile?.id) fetchAllData()
  }, [profile?.id, fetchAllData])

  // Refetch when the tab regains focus (covers Earn → Wallet navigation)
  useEffect(() => {
    if (!profile?.id) return
    const onFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchTransactions({ silent: true })
      }
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [profile?.id, fetchTransactions])

  // Realtime: live insert/update on own transactions
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel(`wallet-tx-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const row = payload.new as Transaction
          const normalised: Transaction = {
            ...row,
            amount_spy: safeNum(row.amount_spy),
            balance_after:
              row.balance_after === null || row.balance_after === undefined
                ? null
                : safeNum(row.balance_after),
            hidden_by_user: Boolean(row.hidden_by_user),
            status: row.status || 'completed',
          }
          setTransactions((prev) => {
            // Avoid duplicate if focus refetch already pulled it
            if (prev.some((t) => t.id === normalised.id)) return prev
            return [normalised, ...prev].slice(0, TX_PAGE_LIMIT)
          })
          setLastSyncedAt(new Date())
          // Also pull fresh profile so balance updates live
          refreshProfile().catch(() => {})
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const row = payload.new as Transaction
          setTransactions((prev) =>
            prev.map((t) =>
              t.id === row.id
                ? {
                    ...t,
                    ...row,
                    amount_spy: safeNum(row.amount_spy),
                    hidden_by_user: Boolean(row.hidden_by_user),
                    status: row.status || t.status,
                  }
                : t
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, refreshProfile])

  // ===== HIDE (soft delete) =====
  const hideTransaction = useCallback(async (txId: string) => {
    // Optimistic
    const prev = transactions
    setTransactions((p) =>
      p.map((t) => (t.id === txId ? { ...t, hidden_by_user: true } : t))
    )

    const { error: err } = await supabase
      .from('transactions')
      .update({ hidden_by_user: true })
      .eq('id', txId)

    if (err) {
      setTransactions(prev) // rollback
      toast.error('Could not hide transaction')
      return
    }
    toast.success('Removed from your view')
  }, [transactions])

  // ===== CANCEL PENDING WITHDRAWAL =====
  const cancelWithdrawal = useCallback(
    async (tx: Transaction) => {
      if (!tx.related_withdrawal_id) return
      if (!confirm('Cancel this withdrawal and return the funds to your available balance?'))
        return

      try {
        const res = await fetch('/api/withdraw/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ withdrawalId: tx.related_withdrawal_id }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Cancel failed')

        toast.success('Withdrawal cancelled — funds returned')
        await fetchAllData()
      } catch (e: any) {
        toast.error(e.message || 'Cancel failed')
      }
    },
    [fetchAllData]
  )

  // ===== WITHDRAW SUBMIT =====
  const handleWithdraw = useCallback(async () => {
    if (!isWithdrawValid) {
      toast.error('Please check your details')
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/withdraw/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountSpy: withdrawAmountNum,
          method: 'usdt',
          address: withdrawAddress.trim(),
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Withdrawal submitted — pending approval')
        setWithdrawAmount('')
        setWithdrawAddress('')
        setShowSendModal(false)
        await fetchAllData()
      } else {
        toast.error(data.error || 'Withdrawal failed')
      }
    } catch {
      toast.error('Withdrawal failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [isWithdrawValid, withdrawAmountNum, withdrawAddress, fetchAllData])

  // ===== FORMATTERS =====
  const formatDate = useCallback((s: string) => {
    try {
      return new Date(s).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return s
    }
  }, [])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return FaArrowDown
      case 'withdrawal':
        return FaArrowUp
      case 'withdrawal_refund':
      case 'task_reward':
      case 'ad_reward':
      case 'referral_bonus':
      case 'earn':
        return FaCoins
      default:
        return FaClock
    }
  }

  const getColor = (type: string, status: string) => {
    if (status === 'pending') return 'muted'
    if (type === 'withdrawal') return 'danger'
    return 'success'
  }

  const humaniseType = (type: string) =>
    type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())

  // ===== RENDER =====
  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.walletPage}>
      {/* ===== BALANCE CARD ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.balanceCard}
      >
        <div className={styles.balanceCardHeader}>
          <div>
            <p className={styles.balanceCardTitle}>Available Balance</p>
            <p className={styles.balanceAmount}>
              {showBalance ? formatUsd(usdBalance) : '••••••'}
            </p>
            <p className={styles.balanceSubtitle}>
              {showBalance ? `${formatSpy(spyBalance)} SPY` : '•••• SPY'}
            </p>
            {spyHeld > 0 && (
              <p className={styles.balanceHeld}>
                <FaLock aria-hidden /> On hold:{' '}
                {showBalance
                  ? `${formatSpy(spyHeld)} SPY (${formatUsd(usdHeld)})`
                  : '••••'}
              </p>
            )}
          </div>
          <button
            className={styles.visibilityToggle}
            onClick={() => setShowBalance((v) => !v)}
            aria-label={showBalance ? 'Hide balance' : 'Show balance'}
          >
            {showBalance ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {walletAddress && (
          <div className={styles.walletAddressBar}>
            <div className={styles.walletAddressChip}>
              <FaWallet className={styles.chipIcon} aria-hidden />
              <span title={walletAddress}>
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </span>
            </div>
          </div>
        )}

        <div className={styles.actionButtons}>
          <button
            className={styles.actionBtn}
            onClick={() => setShowSendModal(true)}
          >
            <div className={styles.actionBtnIcon}>
              <FaPaperPlane aria-hidden />
            </div>
            <span>Withdraw</span>
          </button>
          <Link href="/dashboard/earn" className={styles.actionBtn}>
            <div className={styles.actionBtnIcon}>
              <FaCoins aria-hidden />
            </div>
            <span>Earn</span>
          </Link>
        </div>
      </motion.div>

      {/* ===== ERROR BANNER ===== */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <FaExclamationTriangle className={styles.errorIcon} aria-hidden />
          <span>{error}</span>
          <button
            className={styles.errorDismiss}
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* ===== ASSETS ===== */}
      <div className={styles.assetsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Assets</h2>
          {refreshing && (
            <FaSpinner className={styles.spinning} aria-label="Refreshing" />
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.assetCard}
        >
          <div className={styles.assetIconWrapper}>
            <FaBitcoin className={styles.assetIcon} aria-hidden />
          </div>
          <div className={styles.assetInfo}>
            <p className={styles.assetName}>SPY Token</p>
            <p className={styles.assetNetwork}>BNB Chain • BEP-20</p>
          </div>
          <div className={styles.assetBalance}>
            <p className={styles.assetAmount}>
              {showBalance ? formatSpy(totalSpy) : '••••'}
            </p>
            <p className={styles.assetUsd}>
              {showBalance ? formatUsd(totalSpy * SPY_TO_USD) : '••••'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ===== PENDING WITHDRAWALS ===== */}
      {pendingTx.length > 0 && (
        <div className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <h2 className={styles.historyTitle}>
              <FaClock aria-hidden /> Pending Withdrawals
            </h2>
            <span className={styles.txCount}>{pendingTx.length}</span>
          </div>
          <div className={styles.transactionList}>
            {pendingTx.map((tx) => (
              <div
                key={tx.id}
                className={`${styles.txRow} ${styles.txPending}`}
              >
                <div
                  className={`${styles.txIconWrapper} ${styles.txIconWrapperPending}`}
                >
                  <FaClock
                    className={`${styles.txIcon} ${styles.muted}`}
                    aria-hidden
                  />
                </div>
                <div className={styles.txDetails}>
                  <p className={styles.txTitle}>Withdrawal — pending</p>
                  <p className={styles.txSubtitle}>
                    {formatDate(tx.created_at)}
                  </p>
                </div>
                <div className={styles.txAmountWrapper}>
                  <p className={`${styles.txAmount} ${styles.txMuted}`}>
                    {formatSpy(Math.abs(tx.amount_spy))} SPY
                  </p>
                  {tx.related_withdrawal_id && (
                    <button
                      className={styles.cancelTxBtn}
                      onClick={() => cancelWithdrawal(tx)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== RECENT ACTIVITY ===== */}
      <div className={styles.historyCard}>
        <div className={styles.historyHeader}>
          <h2 className={styles.historyTitle}>
            <FaHistory aria-hidden /> Recent Activity
          </h2>
          {completedTx.length > 0 && (
            <span className={styles.txCount}>{completedTx.length}</span>
          )}
        </div>

        {completedTx.length > 0 ? (
          <div className={styles.transactionList}>
            {completedTx.map((tx) => {
              const Icon = getTransactionIcon(tx.type)
              const color = getColor(tx.type, tx.status)
              const iconWrapperClass =
                color === 'success'
                  ? styles.txIconWrapperSuccess
                  : color === 'danger'
                  ? styles.txIconWrapperDanger
                  : ''
              const iconColorClass = styles[color] || ''

              return (
                <div key={tx.id} className={styles.txRow}>
                  <div
                    className={`${styles.txIconWrapper} ${iconWrapperClass}`}
                  >
                    <Icon
                      className={`${styles.txIcon} ${iconColorClass}`}
                      aria-hidden
                    />
                  </div>
                  <div className={styles.txDetails}>
                    <p className={styles.txTitle}>
                      {humaniseType(tx.type)}
                    </p>
                    <p className={styles.txSubtitle}>
                      {formatDate(tx.created_at)}
                    </p>
                  </div>
                  <div className={styles.txAmountWrapper}>
                    <p
                      className={`${styles.txAmount} ${
                        tx.amount_spy > 0 ? styles.txPositive : styles.txNegative
                      }`}
                    >
                      {tx.amount_spy > 0 ? '+' : ''}
                      {formatSpy(tx.amount_spy)} SPY
                    </p>
                    <button
                      className={styles.hideTxBtn}
                      onClick={() => hideTransaction(tx.id)}
                      title="Hide from your view (still kept on record)"
                      aria-label="Hide transaction"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FaHistory className={styles.emptyIcon} aria-hidden />
            <h3>No activity yet</h3>
            <p>
              {refreshing
                ? 'Loading…'
                : 'Start earning to see your transactions here'}
            </p>
            <Link href="/dashboard/earn" className={styles.emptyLink}>
              Start Earning
            </Link>
          </div>
        )}

        {lastSyncedAt && (
          <p
            style={{
              marginTop: '0.75rem',
              fontSize: '0.75rem',
              color: '#6b7280',
              textAlign: 'right',
            }}
          >
            Last updated {lastSyncedAt.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* ===== WITHDRAW MODAL ===== */}
      <AnimatePresence>
        {showSendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={() => !isLoading && setShowSendModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="withdraw-title"
            >
              <div className={styles.modalHeader}>
                <h2 id="withdraw-title">Withdraw USDT</h2>
                <button
                  className={styles.modalClose}
                  onClick={() => setShowSendModal(false)}
                  disabled={isLoading}
                  aria-label="Close"
                >
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalInputGroup}>
                  <label htmlFor="withdraw-address">
                    Recipient Address (BEP-20)
                  </label>
                  <input
                    id="withdraw-address"
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="0x..."
                    className={styles.modalInput}
                    autoComplete="off"
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label htmlFor="withdraw-amount">Amount (SPY)</label>
                  <div className={styles.modalAmountWrapper}>
                    <input
                      id="withdraw-amount"
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className={styles.modalInput}
                    />
                    <button
                      className={styles.modalMaxBtn}
                      onClick={() => setWithdrawAmount(String(spyBalance))}
                      type="button"
                    >
                      MAX
                    </button>
                  </div>
                  <p className={styles.modalHelper}>
                    Available: {formatSpy(spyBalance)} SPY
                  </p>
                </div>

                {withdrawAmountNum > 0 && (
                  <div className={styles.modalSummary}>
                    <div className={styles.modalSummaryRow}>
                      <span>Amount</span>
                      <span>{formatSpy(withdrawAmountNum)} SPY</span>
                    </div>
                    <div className={styles.modalSummaryRow}>
                      <span>Network Fee (2%)</span>
                      <span className={styles.modalFee}>
                        -{formatSpy(withdrawFee)} SPY
                      </span>
                    </div>
                    <div className={styles.modalSummaryRowTotal}>
                      <span>You Receive</span>
                      <span>{formatSpy(withdrawFinalAmount)} SPY</span>
                    </div>
                    <p className={styles.modalUsdValue}>
                      ≈ {formatUsd(withdrawFinalAmount * SPY_TO_USD)}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleWithdraw}
                  disabled={isLoading || !isWithdrawValid}
                  className={styles.modalSubmitBtn}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className={styles.spinning} /> Processing…
                    </>
                  ) : (
                    <>
                      <FaPaperPlane /> Submit Withdrawal
                    </>
                  )}
                </button>

                <p className={styles.modalMinNote}>
                  Minimum: {MINIMUM_WITHDRAW_SPY} SPY (
                  {formatUsd(MINIMUM_WITHDRAW_SPY * SPY_TO_USD)}) — processing
                  may take up to 24h
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
