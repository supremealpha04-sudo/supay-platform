// app/dashboard/wallet/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaWallet, FaArrowDown, FaArrowUp, FaClock, FaLock, FaUnlockAlt, 
  FaCopy, FaCheck, FaBitcoin, FaUniversity, FaCreditCard,
  FaSpinner, FaExclamationTriangle, FaInfoCircle, FaRocket
} from 'react-icons/fa'
import { depositRules, withdrawalRules } from '@/lib/constants/depositRules'
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

interface PendingDeposit {
  id: string
  amount_usd: number
  amount_spy: number
  status: 'pending' | 'processing' | 'completed'
  created_at: string
  method: string
}

interface BankDetails {
  bankName: string
  accountNumber: string
  accountName: string
}

// ============================================
// CONSTANTS
// ============================================
const WITHDRAW_METHODS = [
  { id: 'usdt', label: 'USDT (BEP-20)', fee: '2%', time: '1-4 hours', icon: FaBitcoin },
  { id: 'bank', label: 'Bank Transfer (NGN)', fee: '2%', time: '12-24 hours', icon: FaUniversity }
] as const

const BANKS = [
  'GTBank',
  'Access Bank', 
  'First Bank',
  'UBA',
  'Zenith Bank',
  'Fidelity Bank',
  'Opay',
  'PalmPay'
] as const

// ============================================
// MAIN COMPONENT
// ============================================
export default function WalletPage() {
  const { profile, refreshProfile } = useAuth()
  
  // ===== STATE =====
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState<'usdt' | 'bank'>('usdt')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [bankDetails, setBankDetails] = useState<BankDetails>({ 
    bankName: '', 
    accountNumber: '', 
    accountName: '' 
  })
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
    return Math.max(Math.ceil(withdrawAmountNum * 0.02), 10)
  }, [withdrawAmountNum])
  
  const withdrawFinalAmount = useMemo(() => {
    return Math.max(withdrawAmountNum - withdrawFee, 0)
  }, [withdrawAmountNum, withdrawFee])

  const isWithdrawValid = useMemo(() => {
    return (
      withdrawAmountNum >= withdrawalRules.minimum.SPY &&
      withdrawAmountNum <= withdrawalRules.maximum.SPY &&
      withdrawAmountNum <= withdrawableSpy &&
      (withdrawMethod === 'usdt' ? withdrawAddress.length > 0 : true) &&
      (withdrawMethod === 'bank' ? (
        bankDetails.bankName.length > 0 &&
        bankDetails.accountNumber.length >= 10 &&
        bankDetails.accountName.length > 0
      ) : true)
    )
  }, [withdrawAmountNum, withdrawableSpy, withdrawMethod, withdrawAddress, bankDetails])

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
  const handleDepositClick = useCallback(() => {
    toast('🚀 Deposits are coming soon!', {
      icon: '⏳',
      duration: 3000,
      style: {
        background: 'linear-gradient(135deg, #818cf8, #6366f1)',
        color: '#fff',
        fontWeight: 600,
      },
    })
  }, [])

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
          method: withdrawMethod,
          address: withdrawMethod === 'usdt' ? withdrawAddress : undefined,
          bankDetails: withdrawMethod === 'bank' ? bankDetails : undefined,
          userId: profile?.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Withdrawal request submitted! Admin will process within 24 hours.')
        setWithdrawAmount('')
        setWithdrawAddress('')
        setBankDetails({ bankName: '', accountNumber: '', accountName: '' })
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
    withdrawMethod, 
    withdrawAddress, 
    bankDetails, 
    profile?.id, 
    fetchBalanceBreakdown, 
    fetchTransactions, 
    refreshProfile
  ])

  const getTransactionIcon = useCallback((type: string) => {
    switch(type) {
      case 'deposit': return FaArrowDown
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

  // ===== RENDER =====
  return (
    <div className={styles.walletPage}>
      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className={styles.errorDismiss}>
            ×
          </button>
        </div>
      )}

      {/* Refresh Indicator */}
      {refreshing && (
        <div className={styles.refreshIndicator}>
          <FaSpinner className={styles.spinning} />
          <span>Refreshing...</span>
        </div>
      )}

      {/* Balance Cards */}
      <div className={styles.statsGrid}>
        <motion.div 
          className={styles.balanceCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.balanceCardHeader}>
            <div>
              <p className={styles.balanceCardTitle}>Withdrawable SPY</p>
              <p className={styles.balanceAmount}>{withdrawableSpy.toLocaleString()} SPY</p>
              <p className={styles.balanceSubtitle}>≈ ${(withdrawableSpy / 100).toFixed(2)} USD</p>
            </div>
            <FaUnlockAlt className={styles.balanceIcon} />
          </div>
          <p className={styles.helperText}>From tasks, referrals, and staking rewards</p>
        </motion.div>

        <motion.div 
          className={styles.balanceCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.balanceCardHeader}>
            <div>
              <p className={styles.balanceCardTitle}>Locked SPY (30 days)</p>
              <p className={styles.balanceAmount}>{lockedSpy.toLocaleString()} SPY</p>
              <p className={styles.balanceSubtitle}>≈ ${(lockedSpy / 100).toFixed(2)} USD</p>
            </div>
            <FaLock className={`${styles.balanceIcon} ${styles.warningIcon}`} />
          </div>
          <p className={styles.helperText}>From deposits - available after 30 days</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs} role="tablist">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`${styles.tabButton} ${activeTab === 'deposit' ? styles.tabButtonActive : ''}`}
          role="tab"
          aria-selected={activeTab === 'deposit'}
        >
          <FaArrowDown className={styles.iconInline} /> Deposit
          <span className={styles.soonBadge}>Soon</span>
        </button>
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

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {/* ===== DEPOSIT TAB - COMING SOON ===== */}
        {activeTab === 'deposit' && (
          <motion.div
            key="deposit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={styles.tabPanel}
          >
            <div className={styles.comingSoonCard}>
              <motion.div 
                className={styles.comingSoonIcon}
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🚀
              </motion.div>
              
              <h2 className={styles.comingSoonTitle}>Deposits Coming Soon</h2>
              
              <p className={styles.comingSoonText}>
                We're working hard to bring you a seamless deposit experience 
                with multiple payment methods. Stay tuned for updates!
              </p>

              <div className={styles.comingSoonFeatures}>
                <div className={styles.comingSoonFeature}>
                  <span>⚡</span>
                  <span>Instant Deposits</span>
                </div>
                <div className={styles.comingSoonFeature}>
                  <span>🔒</span>
                  <span>Secure Transactions</span>
                </div>
                <div className={styles.comingSoonFeature}>
                  <span>💎</span>
                  <span>Multiple Methods</span>
                </div>
              </div>

              <div className={styles.comingSoonDivider}>
                <span>While you wait</span>
              </div>

              <div className={styles.comingSoonActions}>
                <Link href="/dashboard/earn" className={styles.comingSoonPrimaryBtn}>
                  <FaWallet className={styles.btnIcon} />
                  Start Earning SPY
                </Link>
                <Link href="/dashboard/nft" className={styles.comingSoonSecondaryBtn}>
                  <FaRocket className={styles.btnIcon} />
                  Explore NFTs
                </Link>
              </div>

              <p className={styles.comingSoonNote}>
                💡 Earn SPY from ads, tasks, and referrals while deposits are being set up
              </p>
            </div>
          </motion.div>
        )}

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
              <div className={styles.balanceCardHeader}>
                <div>
                  <p className={styles.balanceCardTitle}>Available to Withdraw</p>
                  <p className={styles.balanceAmount}>{withdrawableSpy.toLocaleString()} SPY</p>
                  <p className={styles.balanceSubtitle}>≈ ${(withdrawableSpy / 100).toFixed(2)} USD</p>
                </div>
              </div>

              {/* Method Selection */}
              <h3 className={styles.balanceCardTitle}>Withdrawal Method</h3>
              <div className={`${styles.methodGrid} ${styles.fieldGroup}`}>
                {WITHDRAW_METHODS.map((method) => {
                  const Icon = method.icon
                  return (
                    <button
                      key={method.id}
                      onClick={() => setWithdrawMethod(method.id as any)}
                      className={`${styles.methodCard} ${withdrawMethod === method.id ? styles.methodCardActive : ''}`}
                      aria-pressed={withdrawMethod === method.id}
                    >
                      <Icon className={styles.methodIcon} />
                      <p className={styles.methodLabel}>{method.label}</p>
                      <p className={styles.methodMeta}>Fee: {method.fee} | {method.time}</p>
                    </button>
                  )
                })}
              </div>

              {/* Amount Input */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Amount (SPY)</label>
                <div className={styles.inputRow}>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`Minimum ${withdrawalRules.minimum.SPY}`}
                    className={styles.inputField}
                    min={withdrawalRules.minimum.SPY}
                    max={Math.min(withdrawalRules.maximum.SPY, withdrawableSpy)}
                    step="1"
                  />
                  <button
                    onClick={() => setWithdrawAmount(Math.min(withdrawableSpy, withdrawalRules.maximum.SPY).toString())}
                    className={styles.secondaryButton}
                  >
                    Max
                  </button>
                </div>
                <div className={styles.helperText}>
                  Minimum: {withdrawalRules.minimum.SPY} SPY | Maximum: {Math.min(withdrawalRules.maximum.SPY, withdrawableSpy)} SPY
                </div>
              </div>

              {/* Fee Display */}
              {withdrawAmountNum > 0 && (
                <motion.div 
                  className={styles.nestedSection}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div className={styles.summaryRow}>
                    <span className={styles.methodMeta}>Amount</span>
                    <span className={styles.balanceAmount}>{withdrawAmountNum.toLocaleString()} SPY</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.methodMeta}>Fee (2%)</span>
                    <span className={styles.warningBox}>{withdrawFee} SPY</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.methodLabel}>You Receive</span>
                    <span className={styles.txPositive}>{withdrawFinalAmount.toLocaleString()} SPY</span>
                  </div>
                </motion.div>
              )}

              {/* Wallet Address */}
              {withdrawMethod === 'usdt' && (
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>BEP-20 Wallet Address</label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="0x..."
                    className={styles.inputField}
                  />
                </div>
              )}

              {/* Bank Details */}
              {withdrawMethod === 'bank' && (
                <div className={styles.fieldGroup}>
                  <div className={styles.nestedSection}>
                    <label className={styles.fieldLabel}>Bank Name</label>
                    <select
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      className={styles.selectField}
                    >
                      <option value="">Select Bank</option>
                      {BANKS.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.nestedSection}>
                    <label className={styles.fieldLabel}>Account Number</label>
                    <input
                      type="text"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                      placeholder="10-digit account number"
                      className={styles.inputField}
                      maxLength={10}
                      pattern="[0-9]{10}"
                    />
                  </div>
                  <div className={styles.nestedSection}>
                    <label className={styles.fieldLabel}>Account Name</label>
                    <input
                      type="text"
                      value={bankDetails.accountName}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                      placeholder="Full name on account"
                      className={styles.inputField}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleWithdraw}
                disabled={isLoading || !isWithdrawValid}
                className={`${styles.primaryButton} ${(isLoading || !isWithdrawValid) ? styles.primaryButtonDisabled : ''}`}
              >
                {isLoading ? <FaSpinner className={styles.spinning} /> : 'Request Withdrawal'}
              </button>

              <div className={styles.infoBox}>
                <p><strong>ℹ️ Withdrawal Processing:</strong></p>
                <ul className={styles.warningList}>
                  <li>Minimum: {withdrawalRules.minimum.SPY} SPY (${withdrawalRules.minimum.USD})</li>
                  <li>Maximum: {withdrawalRules.maximum.SPY} SPY per day</li>
                  <li>Processing time: {withdrawalRules.processing.time}</li>
                  <li>Fee: {withdrawalRules.fees.percentage}% (min {withdrawalRules.fees.minimumSpy} SPY)</li>
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
              <h3 className={styles.balanceCardTitle}>Transaction History</h3>
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
                      <div className={styles.txIconWrapper}>
                        <Icon className={`${styles.txIcon} ${styles[color]}`} />
                      </div>
                      <div className={styles.txDetails}>
                        <p className={styles.txTitle}>
                          {tx.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          {tx.description && <span className={styles.txDescription}> - {tx.description}</span>}
                        </p>
                        <p className={styles.txSubtitle}>{formatDate(tx.created_at)}</p>
                      </div>
                      <div className={styles.txAmountWrapper}>
                        <p className={`${styles.txAmount} ${tx.amount_spy > 0 ? styles.txPositive : styles.txNegative}`}>
                          {tx.amount_spy > 0 ? '+' : ''}{tx.amount_spy.toLocaleString()} SPY
                        </p>
                        <p className={styles.txBalance}>Balance: {tx.balance_after?.toLocaleString() || '0'} SPY</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <FaWallet className={styles.emptyIcon} />
                <h3>No transactions yet</h3>
                <p>Start earning or deposit to see your activity here</p>
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
