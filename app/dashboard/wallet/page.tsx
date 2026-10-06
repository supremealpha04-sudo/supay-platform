// app/dashboard/wallet/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaWallet, FaArrowUp, FaClock, FaLock, FaUnlockAlt, 
  FaBitcoin, FaSpinner, FaExclamationTriangle, 
  FaInfoCircle, FaCheckCircle, FaCopy, FaCheck
} from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'
import styles from './page.module.css'

const supabase = createClient()

// ============================================
// TYPES
// ============================================
interface Transaction {
  id: string
  type: string
  amount_spy: number
  balance_after: number
  status: string
  created_at: string
  description?: string
}

// ============================================
// CONSTANTS
// ============================================
const MINIMUM_WITHDRAW_USD = 2
const MINIMUM_WITHDRAW_SPY = 200 // 200 SPY = $2
const WITHDRAW_FEE_PERCENT = 2
const WITHDRAW_FEE_MIN_SPY = 10
const MAX_WITHDRAW_SPY = 500000

// ============================================
// MAIN COMPONENT
// ============================================
export default function WalletPage() {
  const { profile, refreshProfile } = useAuth()
  
  // ===== STATE =====
  const [activeTab, setActiveTab] = useState<'withdraw' | 'history'>('withdraw')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [withdrawableSpy, setWithdrawableSpy] = useState(0)
  const [lockedSpy, setLockedSpy] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ===== COMPUTED =====
  const withdrawAmountNum = useMemo(() => parseFloat(withdrawAmount) || 0, [withdrawAmount])
  
  const withdrawFee = useMemo(() => {
    if (withdrawAmountNum <= 0) return 0
    return Math.max(Math.ceil(withdrawAmountNum * (WITHDRAW_FEE_PERCENT / 100)), WITHDRAW_FEE_MIN_SPY)
  }, [withdrawAmountNum])
  
  const withdrawFinalAmount = useMemo(() => {
    return Math.max(withdrawAmountNum - withdrawFee, 0)
  }, [withdrawAmountNum, withdrawFee])

  const isWithdrawValid = useMemo(() => {
    return (
      withdrawAmountNum >= MINIMUM_WITHDRAW_SPY &&
      withdrawAmountNum <= MAX_WITHDRAW_SPY &&
      withdrawAmountNum <= withdrawableSpy &&
      withdrawAddress.length > 10
    )
  }, [withdrawAmountNum, withdrawableSpy, withdrawAddress])

  // ===== DATA FETCHING =====
  const fetchBalanceBreakdown = useCallback(async () => {
    if (!profile?.id) return
    
    try {
      const { data, error } = await supabase
        .from('user_spy_breakdown')
        .select('*')
        .eq('user_id', profile.id)
        .single()
      
      if (error) throw error
      
      if (data) {
        const withdrawable = (data.earned_spy || 0) + (data.referral_spy || 0) + (data.staking_rewards_spy || 0)
        setWithdrawableSpy(withdrawable)
        setLockedSpy(data.deposited_spy || 0)
      }
    } catch (err) {
      console.error('Error fetching balance breakdown:', err)
    }
  }, [profile?.id])

  const fetchTransactions = useCallback(async () => {
    if (!profile?.id) return
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      console.error('Error fetching transactions:', err)
    }
  }, [profile?.id])

  const fetchAllData = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      await Promise.all([
        fetchBalanceBreakdown(),
        fetchTransactions()
      ])
    } catch (err) {
      setError('Failed to load wallet data')
    } finally {
      setRefreshing(false)
    }
  }, [fetchBalanceBreakdown, fetchTransactions])

  // ===== EFFECTS =====
  useEffect(() => {
    if (profile) {
      fetchAllData()
    }
  }, [profile, fetchAllData])

  // ===== HANDLERS =====
  const handleWithdraw = useCallback(async () => {
    if (!isWithdrawValid) {
      toast.error('Please check your withdrawal details')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/withdraw/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountSpy: withdrawAmountNum,
          method: 'usdt',
          address: withdrawAddress,
          userId: profile?.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Withdrawal request submitted! 🎉')
        setWithdrawAmount('')
        setWithdrawAddress('')
        await Promise.all([
          fetchBalanceBreakdown(),
          fetchTransactions(),
          refreshProfile()
        ])
      } else {
        toast.error(data.error || 'Withdrawal failed')
      }
    } catch (err) {
      console.error('Withdrawal error:', err)
      toast.error('Withdrawal failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [
    isWithdrawValid, 
    withdrawAmountNum, 
    withdrawAddress, 
    profile?.id, 
    fetchBalanceBreakdown, 
    fetchTransactions, 
    refreshProfile
  ])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }, [])

  const getTransactionIcon = useCallback((type: string) => {
    switch(type) {
      case 'deposit': return FaArrowUp
      case 'withdrawal': return FaArrowUp
      case 'earn': return FaWallet
      default: return FaClock
    }
  }, [])

  const getTransactionColor = useCallback((type: string) => {
    switch(type) {
      case 'deposit': return 'success'
      case 'withdrawal': return 'danger'
      case 'earn': return 'success'
      default: return 'muted'
    }
  }, [])

  // ===== RENDER =====
  return (
    <div className={styles.walletPage}>
      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className={styles.errorDismiss}>×</button>
        </div>
      )}

      {/* Refresh Indicator */}
      {refreshing && (
        <div className={styles.refreshIndicator}>
          <FaSpinner className={styles.spinning} />
          <span>Refreshing...</span>
        </div>
      )}

      {/* ===== BALANCE CARDS ===== */}
      <div className={styles.statsGrid}>
        <motion.div 
          className={styles.balanceCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.balanceCardHeader}>
            <div>
              <p className={styles.balanceCardTitle}>Available Balance</p>
              <p className={styles.balanceAmount}>{withdrawableSpy.toLocaleString()} SPY</p>
              <p className={styles.balanceSubtitle}>≈ ${(withdrawableSpy / 100).toFixed(2)} USD</p>
            </div>
            <div className={styles.balanceIcon}>
              <FaUnlockAlt />
            </div>
          </div>
          <p className={styles.helperText}>Earned from tasks, referrals & rewards</p>
        </motion.div>

        <motion.div 
          className={styles.balanceCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.balanceCardHeader}>
            <div>
              <p className={styles.balanceCardTitle}>Locked Balance</p>
              <p className={styles.balanceAmount}>{lockedSpy.toLocaleString()} SPY</p>
              <p className={styles.balanceSubtitle}>≈ ${(lockedSpy / 100).toFixed(2)} USD</p>
            </div>
            <div className={`${styles.balanceIcon} ${styles.warningIcon}`}>
              <FaLock />
            </div>
          </div>
          <p className={styles.helperText}>Available after unlock period</p>
        </motion.div>
      </div>

      {/* ===== TABS ===== */}
      <div className={styles.tabs} role="tablist">
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`${styles.tabButton} ${activeTab === 'withdraw' ? styles.tabButtonActive : ''}`}
          role="tab"
          aria-selected={activeTab === 'withdraw'}
        >
          <FaArrowUp className={styles.iconInline} /> Withdraw
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`${styles.tabButton} ${activeTab === 'history' ? styles.tabButtonActive : ''}`}
          role="tab"
          aria-selected={activeTab === 'history'}
        >
          <FaClock className={styles.iconInline} /> History
        </button>
      </div>

      {/* ===== TAB PANELS ===== */}
      <AnimatePresence mode="wait">
        {/* ===== WITHDRAW TAB ===== */}
        {activeTab === 'withdraw' && (
          <motion.div
            key="withdraw"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={styles.tabPanel}
          >
            <div className={styles.sectionCard}>
              {/* Balance Display */}
              <div className={styles.balanceHeaderCard}>
                <div>
                  <p className={styles.balanceHeaderLabel}>Available to Withdraw</p>
                  <p className={styles.balanceHeaderAmount}>{withdrawableSpy.toLocaleString()} SPY</p>
                  <p className={styles.balanceHeaderSubtitle}>≈ ${(withdrawableSpy / 100).toFixed(2)} USD</p>
                </div>
                <div className={styles.balanceHeaderIcon}>
                  <FaWallet />
                </div>
              </div>

              {/* Method - Only USDT */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Withdrawal Method</label>
                <div className={styles.methodSingle}>
                  <div className={styles.methodSingleIcon}>
                    <FaBitcoin />
                  </div>
                  <div className={styles.methodSingleContent}>
                    <p className={styles.methodSingleLabel}>USDT (BEP-20)</p>
                    <p className={styles.methodSingleMeta}>
                      Fee: {WITHDRAW_FEE_PERCENT}% • 1-4 hours
                    </p>
                  </div>
                  <FaCheckCircle className={styles.methodSingleCheck} />
                </div>
              </div>

              {/* Amount Input */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldHeader}>
                  <label className={styles.fieldLabel}>Amount (SPY)</label>
                  <span className={styles.fieldHint}>
                    Min: {MINIMUM_WITHDRAW_SPY} SPY (${MINIMUM_WITHDRAW_USD})
                  </span>
                </div>
                <div className={styles.inputRow}>
                  <div className={styles.inputWrapper}>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder={`Minimum ${MINIMUM_WITHDRAW_SPY}`}
                      className={styles.inputField}
                      min={MINIMUM_WITHDRAW_SPY}
                      max={Math.min(MAX_WITHDRAW_SPY, withdrawableSpy)}
                      step="1"
                    />
                    <button
                      onClick={() => setWithdrawAmount(Math.min(withdrawableSpy, MAX_WITHDRAW_SPY).toString())}
                      className={styles.maxButton}
                      type="button"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown */}
              {withdrawAmountNum > 0 && (
                <motion.div 
                  className={styles.feeBreakdown}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div className={styles.feeRow}>
                    <span className={styles.feeLabel}>Amount</span>
                    <span className={styles.feeValue}>{withdrawAmountNum.toLocaleString()} SPY</span>
                  </div>
                  <div className={styles.feeRow}>
                    <span className={styles.feeLabel}>Fee ({WITHDRAW_FEE_PERCENT}%)</span>
                    <span className={styles.feeValueNegative}>-{withdrawFee} SPY</span>
                  </div>
                  <div className={`${styles.feeRow} ${styles.feeRowTotal}`}>
                    <span className={styles.feeLabelTotal}>You Receive</span>
                    <span className={styles.feeValueTotal}>
                      {withdrawFinalAmount.toLocaleString()} SPY
                    </span>
                  </div>
                  <div className={styles.feeUsdValue}>
                    ≈ ${(withdrawFinalAmount / 100).toFixed(2)} USD
                  </div>
                </motion.div>
              )}

              {/* USDT Address Input */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>USDT Wallet Address (BEP-20)</label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="0x..."
                  className={styles.inputField}
                />
                <p className={styles.fieldHelper}>
                  <FaInfoCircle className={styles.helperIcon} />
                  Make sure this is a BEP-20 (BSC) address
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleWithdraw}
                disabled={isLoading || !isWithdrawValid}
                className={`${styles.primaryButton} ${(isLoading || !isWithdrawValid) ? styles.primaryButtonDisabled : ''}`}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className={styles.spinning} />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaArrowUp />
                    Request Withdrawal
                  </>
                )}
              </button>

              {/* Info Box */}
              <div className={styles.infoBox}>
                <div className={styles.infoBoxHeader}>
                  <FaInfoCircle className={styles.infoBoxIcon} />
                  <span className={styles.infoBoxTitle}>Withdrawal Information</span>
                </div>
                <ul className={styles.infoList}>
                  <li>Minimum: {MINIMUM_WITHDRAW_SPY} SPY (${MINIMUM_WITHDRAW_USD})</li>
                  <li>Maximum: {MAX_WITHDRAW_SPY.toLocaleString()} SPY per day</li>
                  <li>Processing time: 1-4 hours</li>
                  <li>Fee: {WITHDRAW_FEE_PERCENT}% (min {WITHDRAW_FEE_MIN_SPY} SPY)</li>
                  <li>Network: BEP-20 (BNB Chain)</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={styles.historyCard}
          >
            <div className={styles.historyHeader}>
              <h3 className={styles.historyTitle}>Transaction History</h3>
              {transactions.length > 0 && (
                <span className={styles.txCount}>{transactions.length} transactions</span>
              )}
            </div>
            
            {transactions.length > 0 ? (
              <div className={styles.transactionList}>
                {transactions.map((tx) => {
                  const Icon = getTransactionIcon(tx.type)
                  const color = getTransactionColor(tx.type)
                  return (
                    <div key={tx.id} className={styles.txRow}>
                      <div className={`${styles.txIconWrapper} ${styles[`txIconWrapper${color.charAt(0).toUpperCase() + color.slice(1)}`]}`}>
                        <Icon className={`${styles.txIcon} ${styles[color]}`} />
                      </div>
                      <div className={styles.txDetails}>
                        <p className={styles.txTitle}>
                          {tx.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className={styles.txSubtitle}>{formatDate(tx.created_at)}</p>
                        {tx.description && (
                          <p className={styles.txDescription}>{tx.description}</p>
                        )}
                      </div>
                      <div className={styles.txAmountWrapper}>
                        <p className={`${styles.txAmount} ${tx.amount_spy > 0 ? styles.txPositive : styles.txNegative}`}>
                          {tx.amount_spy > 0 ? '+' : ''}{tx.amount_spy.toLocaleString()} SPY
                        </p>
                        <p className={styles.txBalance}>
                          {tx.balance_after?.toLocaleString() || '0'} SPY
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <FaWallet className={styles.emptyIcon} />
                <h3>No transactions yet</h3>
                <p>Start earning to see your activity here</p>
                <Link href="/dashboard/earn" className={styles.emptyLink}>
                  Start Earning
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
