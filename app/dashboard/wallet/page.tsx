// app/dashboard/wallet/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaWallet, FaArrowUp, FaArrowDown, FaClock, FaLock, FaUnlockAlt, 
  FaBitcoin, FaSpinner, FaExclamationTriangle, FaInfoCircle, 
  FaCheckCircle, FaEye, FaEyeSlash, FaPaperPlane, FaQrcode,
  FaHistory, FaCoins, FaChevronRight, FaTimes
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
const SPY_TO_USD = 0.01 // 1 SPY = $0.01
const MINIMUM_WITHDRAW_SPY = 200 
const WITHDRAW_FEE_PERCENT = 2
const WITHDRAW_FEE_MIN_SPY = 10
const MAX_WITHDRAW_SPY = 500000

// ============================================
// MAIN COMPONENT
// ============================================
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
  
  // Modal state
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)

  // ===== COMPUTED =====
  const spyBalance = Number(profile?.spy_balance) || 0
  const usdBalance = spyBalance * SPY_TO_USD
  
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
      withdrawAmountNum <= spyBalance &&
      withdrawAddress.length > 10
    )
  }, [withdrawAmountNum, spyBalance, withdrawAddress])

  // ===== DATA FETCHING =====
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
        fetchTransactions(),
        refreshProfile() // This updates the balance in real-time
      ])
    } catch (err) {
      setError('Failed to load wallet data')
    } finally {
      setRefreshing(false)
    }
  }, [fetchTransactions, refreshProfile])

  // ===== EFFECTS =====
  useEffect(() => {
    if (profile) {
      fetchAllData()
    }
  }, [profile?.id]) // Only trigger on ID change to prevent spam

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
        setShowSendModal(false)
        await Promise.all([
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
  }, [isWithdrawValid, withdrawAmountNum, withdrawAddress, profile?.id, fetchTransactions, refreshProfile])

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }, [])

  const getTransactionIcon = useCallback((type: string) => {
    switch(type) {
      case 'deposit': return FaArrowDown
      case 'withdrawal': return FaArrowUp
      case 'task_reward': 
      case 'ad_reward': 
      case 'referral_bonus': return FaCoins
      default: return FaClock
    }
  }, [])

  const getTransactionColor = useCallback((type: string) => {
    switch(type) {
      case 'deposit': return 'success'
      case 'withdrawal': return 'danger'
      case 'task_reward':
      case 'ad_reward':
      case 'referral_bonus': return 'success'
      default: return 'muted'
    }
  }, [])

  // ===== RENDER =====
  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.walletContainer}>
      {/* ===== WEB3 MAIN BALANCE CARD ===== */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.mainBalanceCard}
      >
        <div className={styles.balanceHeader}>
          <div className={styles.balanceHeaderLeft}>
            <FaWallet className={styles.walletIcon} />
            <span>Main Wallet</span>
          </div>
          <button 
            className={styles.visibilityToggle}
            onClick={() => setShowBalance(!showBalance)}
          >
            {showBalance ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <div className={styles.balanceBody}>
          <p className={styles.totalBalanceLabel}>Total Balance</p>
          <div className={styles.totalBalanceValue}>
            {showBalance ? (
              <>
                <span className={styles.currencySymbol}>$</span>
                {usdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className={styles.usdLabel}>USD</span>
              </>
            ) : (
              <span className={styles.hiddenBalance}>••••••</span>
            )}
          </div>
          {showBalance && (
            <p className={styles.spyEquivalent}>
              {spyBalance.toLocaleString()} SPY
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button 
            className={styles.actionBtn}
            onClick={() => setShowSendModal(true)}
          >
            <div className={styles.actionBtnIcon}>
              <FaPaperPlane />
            </div>
            <span>Send</span>
          </button>
          
          <button 
            className={styles.actionBtn}
            onClick={() => setShowReceiveModal(true)}
          >
            <div className={styles.actionBtnIcon}>
              <FaQrcode />
            </div>
            <span>Receive</span>
          </button>

          <Link href="/dashboard/earn" className={styles.actionBtn}>
            <div className={styles.actionBtnIcon}>
              <FaCoins />
            </div>
            <span>Earn</span>
          </Link>
        </div>
      </motion.div>

      {/* ===== ASSETS SECTION ===== */}
      <div className={styles.assetsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Assets</h2>
          {refreshing && <FaSpinner className={styles.spinning} />}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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
            <p className={styles.assetAmount}>{showBalance ? spyBalance.toLocaleString() : '••••'}</p>
            <p className={styles.assetUsd}>
              {showBalance ? `$${usdBalance.toFixed(2)}` : '••••'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ===== RECENT ACTIVITY ===== */}
      <div className={styles.activitySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <FaHistory className={styles.sectionIcon} /> Recent Activity
          </h2>
          {transactions.length > 0 && (
            <span className={styles.txCount}>{transactions.length}</span>
          )}
        </div>

        {transactions.length > 0 ? (
          <div className={styles.activityList}>
            {transactions.map((tx) => {
              const Icon = getTransactionIcon(tx.type)
              const color = getTransactionColor(tx.type)
              return (
                <div key={tx.id} className={styles.activityItem}>
                  <div className={`${styles.activityIcon} ${styles[color]}`}>
                    <Icon />
                  </div>
                  <div className={styles.activityDetails}>
                    <p className={styles.activityTitle}>
                      {tx.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className={styles.activityDate}>{formatDate(tx.created_at)}</p>
                  </div>
                  <div className={styles.activityAmount}>
                    <p className={tx.amount_spy > 0 ? styles.amountPositive : styles.amountNegative}>
                      {tx.amount_spy > 0 ? '+' : ''}{tx.amount_spy.toLocaleString()} SPY
                    </p>
                    <p className={styles.activityBalance}>
                      {tx.balance_after?.toLocaleString() || '0'} SPY
                    </p>
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
            <Link href="/dashboard/earn" className={styles.emptyLink}>
              Start Earning
            </Link>
          </div>
        )}
      </div>

      {/* ===== SEND MODAL (Withdraw) ===== */}
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
            >
              <div className={styles.modalHeader}>
                <h2>Send USDT</h2>
                <button 
                  className={styles.modalClose}
                  onClick={() => setShowSendModal(false)}
                  disabled={isLoading}
                >
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalInputGroup}>
                  <label>Recipient Address (BEP-20)</label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
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
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className={styles.modalInput}
                    />
                    <button
                      onClick={() => setWithdrawAmount(spyBalance.toString())}
                      className={styles.modalMaxBtn}
                    >
                      MAX
                    </button>
                  </div>
                  <p className={styles.modalHelper}>
                    Available: {spyBalance.toLocaleString()} SPY
                  </p>
                </div>

                {/* Fee Summary */}
                {withdrawAmountNum > 0 && (
                  <div className={styles.modalSummary}>
                    <div className={styles.modalSummaryRow}>
                      <span>Amount</span>
                      <span>{withdrawAmountNum.toLocaleString()} SPY</span>
                    </div>
                    <div className={styles.modalSummaryRow}>
                      <span>Network Fee (2%)</span>
                      <span className={styles.modalFee}>-{withdrawFee} SPY</span>
                    </div>
                    <div className={styles.modalSummaryRowTotal}>
                      <span>You Receive</span>
                      <span>{withdrawFinalAmount.toLocaleString()} SPY</span>
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
                  {isLoading ? (
                    <><FaSpinner className={styles.spinning} /> Processing...</>
                  ) : (
                    <><FaPaperPlane /> Send Now</>
                  )}
                </button>
                
                <p className={styles.modalMinNote}>
                  Minimum: {MINIMUM_WITHDRAW_SPY} SPY (${(MINIMUM_WITHDRAW_SPY * SPY_TO_USD).toFixed(2)})
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== RECEIVE MODAL ===== */}
      <AnimatePresence>
        {showReceiveModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={() => setShowReceiveModal(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Receive SPY</h2>
                <button 
                  className={styles.modalClose}
                  onClick={() => setShowReceiveModal(false)}
                >
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.receiveContent}>
                  <div className={styles.qrPlaceholder}>
                    <FaQrcode />
                  </div>
                  <p className={styles.receiveLabel}>Your SPY Wallet Address</p>
                  <div className={styles.receiveAddress}>
                    <code>{user?.id || 'Loading...'}</code>
                  </div>
                  <p className={styles.receiveNote}>
                    <FaInfoCircle /> 
                    Send only SPY (BEP-20) to this address. Sending other assets may result in loss of funds.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
