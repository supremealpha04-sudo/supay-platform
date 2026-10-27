// app/dashboard/wallet/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaWallet, FaArrowUp, FaArrowDown, FaClock, FaBitcoin, FaSpinner,
  FaExclamationTriangle, FaEye, FaEyeSlash, FaPaperPlane,
  FaHistory, FaCoins, FaTimes, FaLock, FaTrashAlt
} from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'
import styles from './page.module.css'

const supabase = createClient()

interface Transaction {
  id: string
  type: string
  amount_spy: number
  balance_after: number | null
  status: string
  created_at: string
  description?: string
  hidden_by_user?: boolean
  related_withdrawal_id?: string | null
}

const SPY_TO_USD = 0.01
const MINIMUM_WITHDRAW_SPY = 200
const WITHDRAW_FEE_PERCENT = 2
const WITHDRAW_FEE_MIN_SPY = 10
const MAX_WITHDRAW_SPY = 500000

export default function WalletPage() {
  const { profile, refreshProfile, isLoading: authLoading } = useAuth()

  const [showBalance, setShowBalance] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)

  // ===== COMPUTED =====
  const spyBalance = Number(profile?.spy_balance) || 0
  const spyHeld = Number((profile as any)?.spy_held) || 0
  const totalSpy = spyBalance + spyHeld
  const usdBalance = spyBalance * SPY_TO_USD
  const usdHeld = spyHeld * SPY_TO_USD

  const walletAddress: string | null = (profile as any)?.wallet_address || null

  const withdrawAmountNum = useMemo(() => parseFloat(withdrawAmount) || 0, [withdrawAmount])
  const withdrawFee = useMemo(() => {
    if (withdrawAmountNum <= 0) return 0
    return Math.max(Math.ceil(withdrawAmountNum * (WITHDRAW_FEE_PERCENT / 100)), WITHDRAW_FEE_MIN_SPY)
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
      withdrawAddress.length > 10,
    [withdrawAmountNum, spyBalance, withdrawAddress]
  )

  // Split: completed (visible) vs pending
  const completedTx = useMemo(
    () => transactions.filter(t => t.status === 'completed' && !t.hidden_by_user),
    [transactions]
  )
  const pendingTx = useMemo(
    () => transactions.filter(t => t.status === 'pending'),
    [transactions]
  )

  // ===== FETCH =====
  const fetchTransactions = useCallback(async () => {
    if (!profile?.id) return
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) { console.error(error); return }
    setTransactions(data || [])
  }, [profile?.id])

  const fetchAllData = useCallback(async () => {
    setRefreshing(true); setError(null)
    try { await Promise.all([fetchTransactions(), refreshProfile()]) }
    catch { setError('Failed to load wallet data') }
    finally { setRefreshing(false) }
  }, [fetchTransactions, refreshProfile])

  useEffect(() => { if (profile?.id) fetchAllData() }, [profile?.id, fetchAllData])

  // ===== HIDE (soft delete) =====
  const hideTransaction = useCallback(async (txId: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ hidden_by_user: true })
      .eq('id', txId)
    if (error) { toast.error('Could not hide'); return }
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, hidden_by_user: true } : t))
    toast.success('Removed from your view')
  }, [])

  // ===== CANCEL PENDING WITHDRAWAL =====
  const cancelWithdrawal = useCallback(async (tx: Transaction) => {
    if (!tx.related_withdrawal_id) return
    if (!confirm('Cancel this withdrawal and return the funds to your available balance?')) return
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
  }, [fetchAllData])

  // ===== WITHDRAW SUBMIT =====
  const handleWithdraw = useCallback(async () => {
    if (!isWithdrawValid) { toast.error('Please check your details'); return }
    setIsLoading(true); setError(null)
    try {
      const res = await fetch('/api/withdraw/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountSpy: withdrawAmountNum,
          method: 'usdt',
          address: withdrawAddress,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Withdrawal submitted — pending approval')
        setWithdrawAmount(''); setWithdrawAddress(''); setShowSendModal(false)
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

  const formatDate = useCallback((s: string) => {
    try {
      return new Date(s).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    } catch { return s }
  }, [])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return FaArrowDown
      case 'withdrawal': return FaArrowUp
      case 'task_reward':
      case 'ad_reward':
      case 'referral_bonus': return FaCoins
      default: return FaClock
    }
  }

  const getColor = (type: string, status: string) => {
    if (status === 'pending') return 'muted'
    if (type === 'withdrawal') return 'danger'
    return 'success'
  }

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
      {/* BALANCE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={styles.balanceCard}
      >
        <div className={styles.balanceCardHeader}>
          <div>
            <p className={styles.balanceCardTitle}>Available Balance</p>
            <p className={styles.balanceAmount}>
              {showBalance ? `$${usdBalance.toFixed(2)}` : '••••••'}
            </p>
            <p className={styles.balanceSubtitle}>
              {showBalance ? `${spyBalance.toLocaleString()} SPY` : '•••• SPY'}
            </p>
            {spyHeld > 0 && (
              <p className={styles.balanceHeld}>
                <FaLock /> On hold: {showBalance ? `${spyHeld.toLocaleString()} SPY ($${usdHeld.toFixed(2)})` : '••••'}
              </p>
            )}
          </div>
          <button
            className={styles.visibilityToggle}
            onClick={() => setShowBalance(v => !v)}
            aria-label="Toggle balance"
          >
            {showBalance ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Address (read-only) — no connect button */}
        {walletAddress && (
          <div className={styles.walletAddressBar}>
            <div className={styles.walletAddressChip}>
              <FaWallet className={styles.chipIcon} />
              <span title={walletAddress}>{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</span>
            </div>
          </div>
        )}

        <div className={styles.actionButtons}>
          <button className={styles.actionBtn} onClick={() => setShowSendModal(true)}>
            <div className={styles.actionBtnIcon}><FaPaperPlane /></div>
            <span>Withdraw</span>
          </button>
          <Link href="/dashboard/earn" className={styles.actionBtn}>
            <div className={styles.actionBtnIcon}><FaCoins /></div>
            <span>Earn</span>
          </Link>
        </div>
      </motion.div>

      {error && (
        <div className={styles.errorBanner}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <span>{error}</span>
          <button className={styles.errorDismiss} onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* ASSETS */}
      <div className={styles.assetsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Assets</h2>
          {refreshing && <FaSpinner className={styles.spinning} />}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={styles.assetCard}
        >
          <div className={styles.assetIconWrapper}>
            <FaBitcoin className={styles.assetIcon} />
          </div>
          <div className={styles.assetInfo}>
            <p className={styles.assetName}>SPY Token</p>
            <p className={styles.assetNetwork}>BNB Chain • BEP-20</p>
          </div>
          <div className={styles.assetBalance}>
            <p className={styles.assetAmount}>{showBalance ? totalSpy.toLocaleString() : '••••'}</p>
            <p className={styles.assetUsd}>
              {showBalance ? `$${(totalSpy * SPY_TO_USD).toFixed(2)}` : '••••'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* PENDING WITHDRAWALS — only if any */}
      {pendingTx.length > 0 && (
        <div className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <h2 className={styles.historyTitle}><FaClock /> Pending Withdrawals</h2>
            <span className={styles.txCount}>{pendingTx.length}</span>
          </div>
          <div className={styles.transactionList}>
            {pendingTx.map(tx => (
              <div key={tx.id} className={`${styles.txRow} ${styles.txPending}`}>
                <div className={`${styles.txIconWrapper} ${styles.txIconWrapperPending}`}>
                  <FaClock className={`${styles.txIcon} ${styles.muted}`} />
                </div>
                <div className={styles.txDetails}>
                  <p className={styles.txTitle}>Withdrawal — pending</p>
                  <p className={styles.txSubtitle}>{formatDate(tx.created_at)}</p>
                </div>
                <div className={styles.txAmountWrapper}>
                  <p className={`${styles.txAmount} ${styles.txMuted}`}>
                    {Math.abs(tx.amount_spy).toLocaleString()} SPY
                  </p>
                  <button
                    className={styles.cancelTxBtn}
                    onClick={() => cancelWithdrawal(tx)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPLETED ACTIVITY */}
      <div className={styles.historyCard}>
        <div className={styles.historyHeader}>
          <h2 className={styles.historyTitle}><FaHistory /> Recent Activity</h2>
          {completedTx.length > 0 && <span className={styles.txCount}>{completedTx.length}</span>}
        </div>

        {completedTx.length > 0 ? (
          <div className={styles.transactionList}>
            {completedTx.map(tx => {
              const Icon = getTransactionIcon(tx.type)
              const color = getColor(tx.type, tx.status)
              return (
                <div key={tx.id} className={styles.txRow}>
                  <div className={`${styles.txIconWrapper} ${color === 'success' ? styles.txIconWrapperSuccess : color === 'danger' ? styles.txIconWrapperDanger : ''}`}>
                    <Icon className={`${styles.txIcon} ${styles[color] || ''}`} />
                  </div>
                  <div className={styles.txDetails}>
                    <p className={styles.txTitle}>
                      {tx.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className={styles.txSubtitle}>{formatDate(tx.created_at)}</p>
                  </div>
                  <div className={styles.txAmountWrapper}>
                    <p className={`${styles.txAmount} ${tx.amount_spy > 0 ? styles.txPositive : styles.txNegative}`}>
                      {tx.amount_spy > 0 ? '+' : ''}{tx.amount_spy.toLocaleString()} SPY
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
            <FaHistory className={styles.emptyIcon} />
            <h3>No activity yet</h3>
            <p>Start earning to see your transactions here</p>
            <Link href="/dashboard/earn" className={styles.emptyLink}>Start Earning</Link>
          </div>
        )}
      </div>

      {/* WITHDRAW MODAL */}
      <AnimatePresence>
        {showSendModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={() => !isLoading && setShowSendModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={styles.modalContent}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Withdraw USDT</h2>
                <button className={styles.modalClose} onClick={() => setShowSendModal(false)} disabled={isLoading}>
                  <FaTimes />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalInputGroup}>
                  <label>Recipient Address (BEP-20)</label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={e => setWithdrawAddress(e.target.value)}
                    placeholder="0x..."
                    className={styles.modalInput}
                  />
                </div>
                <div className={styles.modalInputGroup}>
                  <label>Amount (SPY)</label>
                  <div className={styles.modalAmountWrapper}>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className={styles.modalInput}
                    />
                    <button className={styles.modalMaxBtn} onClick={() => setWithdrawAmount(String(spyBalance))}>
                      MAX
                    </button>
                  </div>
                  <p className={styles.modalHelper}>Available: {spyBalance.toLocaleString()} SPY</p>
                </div>
                {withdrawAmountNum > 0 && (
                  <div className={styles.modalSummary}>
                    <div className={styles.modalSummaryRow}>
                      <span>Amount</span><span>{withdrawAmountNum.toLocaleString()} SPY</span>
                    </div>
                    <div className={styles.modalSummaryRow}>
                      <span>Network Fee (2%)</span>
                      <span className={styles.modalFee}>-{withdrawFee} SPY</span>
                    </div>
                    <div className={styles.modalSummaryRowTotal}>
                      <span>You Receive</span><span>{withdrawFinalAmount.toLocaleString()} SPY</span>
                    </div>
                    <p className={styles.modalUsdValue}>
                      ≈ ${(withdrawFinalAmount * SPY_TO_USD).toFixed(2)} USD
                    </p>
                  </div>
                )}
                <button
                  onClick={handleWithdraw}
                  disabled={isLoading || !isWithdrawValid}
                  className={styles.modalSubmitBtn}
                >
                  {isLoading ? <><FaSpinner className={styles.spinning} /> Processing…</> : <><FaPaperPlane /> Submit Withdrawal</>}
                </button>
                <p className={styles.modalMinNote}>
                  Minimum: {MINIMUM_WITHDRAW_SPY} SPY (${(MINIMUM_WITHDRAW_SPY * SPY_TO_USD).toFixed(2)}) — processing may take up to 24h
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
