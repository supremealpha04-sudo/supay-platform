// app/dashboard/wallet/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { FaWallet, FaArrowDown, FaArrowUp, FaClock, FaLock, FaUnlockAlt, FaCopy, FaCheck } from 'react-icons/fa'
import { depositRules, withdrawalRules } from '@/lib/constants/depositRules'
import Link from 'next/link'
import toast from 'react-hot-toast'
import styles from './page.module.css'

const supabase = createClient()

export default function WalletPage() {
  const { profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit')
  const [depositMethod, setDepositMethod] = useState<'crypto' | 'bank' | 'card'>('crypto')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState<'usdt' | 'bank'>('usdt')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', accountName: '' })
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [withdrawableSpy, setWithdrawableSpy] = useState(0)
  const [lockedSpy, setLockedSpy] = useState(0)
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([])

  useEffect(() => {
    if (profile) {
      fetchBalanceBreakdown()
      fetchTransactions()
      fetchPendingDeposits()
    }
  }, [profile])

  async function fetchBalanceBreakdown() {
    const { data } = await supabase
      .from('user_spy_breakdown')
      .select('*')
      .eq('user_id', profile?.id)
      .single()
    
    if (data) {
      const withdrawable = (data.earned_spy || 0) + (data.referral_spy || 0) + (data.staking_rewards_spy || 0)
      setWithdrawableSpy(withdrawable)
      setLockedSpy(data.deposited_spy || 0)
    }
  }

  async function fetchTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setTransactions(data || [])
  }

  async function fetchPendingDeposits() {
    const { data } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', profile?.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    setPendingDeposits(data || [])
  }

  async function handleDeposit() {
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount < depositRules.minimum.USD) {
      toast.error(`Minimum deposit is $${depositRules.minimum.USD}`)
      return
    }
    if (amount > depositRules.maximum.USD) {
      toast.error(`Maximum deposit is $${depositRules.maximum.USD}`)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/deposit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: depositMethod,
          userId: profile?.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (depositMethod === 'crypto') {
          // Show crypto payment details
          toast.success(`Send ${amount} USDT to: ${data.address}`)
          setCopied(false)
        } else if (depositMethod === 'card') {
          // Redirect to Paystack
          window.location.href = data.authorization_url
        } else {
          // Bank transfer instructions
          toast.success('Bank transfer details sent to your email')
        }
        fetchPendingDeposits()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Deposit failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleWithdraw() {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount < withdrawalRules.minimum.SPY) {
      toast.error(`Minimum withdrawal is ${withdrawalRules.minimum.SPY} SPY ($${withdrawalRules.minimum.USD})`)
      return
    }
    if (amount > withdrawalRules.maximum.SPY) {
      toast.error(`Maximum withdrawal is ${withdrawalRules.maximum.SPY} SPY per day`)
      return
    }
    if (amount > withdrawableSpy) {
      toast.error(`Insufficient withdrawable balance. You have ${withdrawableSpy} SPY available.`)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/withdraw/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountSpy: amount,
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
        fetchBalanceBreakdown()
        fetchTransactions()
        refreshProfile()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Withdrawal failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard!')
  }

  const cryptoAddress = "0x1234567890123456789012345678901234567890"

  return (
    <div className={styles.walletPage}>
      {/* Balance Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.balanceCard}>
          <div className={styles.balanceCardHeader}>
            <div>
              <p className={styles.balanceCardTitle}>Withdrawable SPY</p>
              <p className={styles.balanceAmount}>{withdrawableSpy.toLocaleString()} SPY</p>
              <p className={styles.balanceSubtitle}>≈ ${(withdrawableSpy / 100).toFixed(2)} USD</p>
            </div>
            <FaUnlockAlt className={styles.balanceIcon} />
          </div>
          <p className={styles.helperText}>From tasks, referrals, and staking rewards</p>
        </div>

        <div className={styles.balanceCard}>
          <div className={styles.balanceCardHeader}>
            <div>
              <p className={styles.balanceCardTitle}>Locked SPY (30 days)</p>
              <p className={styles.balanceAmount}>{lockedSpy.toLocaleString()} SPY</p>
              <p className={styles.balanceSubtitle}>≈ ${(lockedSpy / 100).toFixed(2)} USD</p>
            </div>
            <FaLock className={`${styles.balanceIcon} ${styles.warningIcon}`} />
          </div>
          <p className={styles.helperText}>From deposits - available after 30 days</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('deposit')}
          className={`${styles.tabButton} ${activeTab === 'deposit' ? styles.tabButtonActive : ''}`}
        >
          <FaArrowDown className={styles.iconInline} /> Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`${styles.tabButton} ${activeTab === 'withdraw' ? styles.tabButtonActive : ''}`}
        >
          <FaArrowUp className={styles.iconInline} /> Withdraw
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`${styles.tabButton} ${activeTab === 'history' ? styles.tabButtonActive : ''}`}
        >
          <FaClock className={styles.iconInline} /> History
        </button>
      </div>

      {/* Deposit Tab */}
      {activeTab === 'deposit' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.tabPanel}>
          {/* Method Selection */}
          <div className={styles.sectionCard}>
            <h3 className={styles.balanceCardTitle}>Select Deposit Method</h3>
            <div className={styles.methodGrid}>
              {[
                { id: 'crypto', label: 'USDT (BEP-20)', icon: '₿', min: '$7' },
                { id: 'bank', label: 'Bank Transfer (NGN)', icon: '🏦', min: '₦10,500' },
                { id: 'card', label: 'Credit/Debit Card', icon: '💳', min: '$7' }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setDepositMethod(method.id as any)}
                  className={`${styles.methodCard} ${depositMethod === method.id ? styles.methodCardActive : ''}`}
                >
                  <div className={styles.methodIcon}>{method.icon}</div>
                  <p className={styles.methodLabel}>{method.label}</p>
                  <p className={styles.methodMeta}>Min: {method.min}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className={styles.sectionCard}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Amount to Deposit</label>
              <div className={styles.inputRow}>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className={styles.inputField}
                />
                <button
                  onClick={handleDeposit}
                  disabled={isLoading}
                  className={`${styles.primaryButton} ${isLoading ? styles.primaryButtonDisabled : ''}`}
                >
                  {isLoading ? 'Processing...' : 'Deposit'}
                </button>
              </div>
              <p className={styles.helperText}>
                You will receive: {(parseFloat(depositAmount) || 0) * 100} SPY
                <br />
                <span className={styles.warningBox}>Note: Deposited SPY is locked for 30 days for security.</span>
              </p>
            </div>
          </div>

          {/* Crypto Address (if crypto selected) */}
          {depositMethod === 'crypto' && (
            <div className={styles.sectionCard}>
              <h3 className={styles.balanceCardTitle}>Send USDT to this address</h3>
              <div className={styles.nestedSection}>
                <div className={styles.balanceCardHeader}>
                  <code className={styles.methodMeta}>{cryptoAddress}</code>
                  <button onClick={() => copyToClipboard(cryptoAddress)} className={styles.copyButton}>
                    {copied ? <FaCheck className={`${styles.balanceIcon} ${styles.successIcon}`} /> : <FaCopy className={`${styles.balanceIcon} ${styles.mutedIcon}`} />}
                  </button>
                </div>
              </div>
              <div className={styles.warningBox}>
                <p>⚠️ Important:</p>
                <ul className={styles.warningList}>
                  <li>• Send only USDT on BEP-20 network</li>
                  <li>• Minimum deposit: $7 USD</li>
                  <li>• Funds will be credited within 1-5 minutes after confirmation</li>
                  <li>• Deposited SPY is locked for 30 days</li>
                </ul>
              </div>
            </div>
          )}

          {/* Pending Deposits */}
          {pendingDeposits.length > 0 && (
            <div className={styles.sectionCard}>
              <h3 className={styles.balanceCardTitle}>Pending Deposits</h3>
              <div className={styles.pendingList}>
                {pendingDeposits.map((deposit) => (
                  <div key={deposit.id} className={styles.pendingItem}>
                    <div>
                      <p className={styles.balanceAmount}>${deposit.amount_usd} USD</p>
                      <p className={styles.pendingMeta}>{new Date(deposit.created_at).toLocaleString()}</p>
                    </div>
                    <div className={styles.pendingStatus}>
                      <span className={styles.pulseDot} />
                      Processing
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 'withdraw' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.tabPanel}>
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
              {[
                { id: 'usdt', label: 'USDT (BEP-20)', fee: '2%', time: '1-4 hours' },
                { id: 'bank', label: 'Bank Transfer (NGN)', fee: '2%', time: '12-24 hours' }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setWithdrawMethod(method.id as any)}
                  className={`${styles.methodCard} ${withdrawMethod === method.id ? styles.methodCardActive : ''}`}
                >
                  <p className={styles.methodLabel}>{method.label}</p>
                  <p className={styles.methodMeta}>Fee: {method.fee} | {method.time}</p>
                </button>
              ))}
            </div>

            {/* Amount Input */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Amount (SPY)</label>
              <div className={styles.inputRow}>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="500 minimum"
                  className={styles.inputField}
                />
                <button
                  onClick={() => setWithdrawAmount(withdrawableSpy.toString())}
                  className={`${styles.secondaryButton}`}
                >
                  Max
                </button>
              </div>
            </div>

            {/* Fee Display */}
            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <div className={styles.nestedSection}>
                <div className={styles.balanceCardHeader}>
                  <span className={styles.methodMeta}>Amount</span>
                  <span className={styles.balanceAmount}>{parseFloat(withdrawAmount).toLocaleString()} SPY</span>
                </div>
                <div className={styles.balanceCardHeader}>
                  <span className={styles.methodMeta}>Fee (2%)</span>
                  <span className={styles.warningBox}>{Math.max(Math.ceil(parseFloat(withdrawAmount) * 0.02), 10)} SPY</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.methodLabel}>You Receive</span>
                  <span className={styles.txPositive}>{parseFloat(withdrawAmount) - Math.max(Math.ceil(parseFloat(withdrawAmount) * 0.02), 10)} SPY</span>
                </div>
              </div>
            )}

            {/* Wallet Address (USDT) */}
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
                  <label htmlFor="bank-name" className={styles.fieldLabel}>Bank Name</label>
                  <select
                    id="bank-name"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                    className={styles.selectField}
                  >
                    <option value="">Select Bank</option>
                    <option value="GTBank">GTBank</option>
                    <option value="Access Bank">Access Bank</option>
                    <option value="First Bank">First Bank</option>
                    <option value="UBA">UBA</option>
                    <option value="Zenith Bank">Zenith Bank</option>
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
              disabled={isLoading || withdrawableSpy < withdrawalRules.minimum.SPY}
              className={`${styles.primaryButton} ${(isLoading || withdrawableSpy < withdrawalRules.minimum.SPY) ? styles.primaryButtonDisabled : ''}`}
            >
              {isLoading ? 'Processing...' : 'Request Withdrawal'}
            </button>

            <div className={styles.infoBox}>
              <p>ℹ️ Withdrawal Processing:</p>
              <ul className={styles.warningList}>
                <li>• Minimum: {withdrawalRules.minimum.SPY} SPY (${withdrawalRules.minimum.USD})</li>
                <li>• Maximum: {withdrawalRules.maximum.SPY} SPY per day</li>
                <li>• Processing time: {withdrawalRules.processing.time}</li>
                <li>• Fee: {withdrawalRules.fees.percentage}% (min {withdrawalRules.fees.minimumSpy} SPY)</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.historyCard}>
          <h3 className={styles.balanceCardTitle}>Transaction History</h3>
          {transactions.length > 0 ? (
            <div className={styles.transactionList}>
              {transactions.map((tx) => (
                <div key={tx.id} className={styles.txRow}>
                  <div className={styles.txDetails}>
                    <p className={styles.txTitle}>{tx.type.replace('_', ' ')}</p>
                    <p className={styles.txSubtitle}>{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <div className={styles.txDetails}>
                    <p className={`${styles.txAmount} ${tx.amount_spy > 0 ? styles.txPositive : styles.txNegative}`}>
                      {tx.amount_spy > 0 ? '+' : ''}{tx.amount_spy} SPY
                    </p>
                    <p className={styles.txBalance}>Balance: {tx.balance_after} SPY</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`${styles.helperText} ${styles.emptyState}`}>No transactions yet</p>
          )}
        </motion.div>
      )}
    </div>
  )
}
