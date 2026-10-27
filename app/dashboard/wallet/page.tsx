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
  FaHistory, FaCoins, FaTimes, FaCopy, FaLink, FaUnlink,
  FaNetworkWired, FaExternalLinkAlt
} from 'react-icons/fa'
import { QRCodeSVG } from 'qrcode.react'
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
const SPY_TO_USD = 0.01
const MINIMUM_WITHDRAW_SPY = 200
const WITHDRAW_FEE_PERCENT = 2
const WITHDRAW_FEE_MIN_SPY = 10
const MAX_WITHDRAW_SPY = 500000
const BSC_CHAIN_ID = '0x38' // 56 decimal
const BSC_EXPLORER = 'https://bscscan.com'

// ============================================
// HELPERS
// ============================================
function shortenAddress(addr?: string | null): string {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch {
    toast.error('Copy failed')
  }
}

// Minimal EIP-1193 typing (avoid hard dependency on wagmi)
type EthereumProvider = {
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on?: (event: string, cb: (...args: any[]) => void) => void
  removeListener?: (event: string, cb: (...args: any[]) => void) => void
}

function getEthereum(): EthereumProvider | null {
  if (typeof window === 'undefined') return null
  return (window as any).ethereum ?? null
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function WalletPage() {
  const { profile, user, refreshProfile, isLoading: authLoading } = useAuth()

  // ===== STATE =====
  const [showBalance, setShowBalance] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Wallet connection state (Web3)
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [chainId, setChainId] = useState<string | null>(null)

  // Modal state
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)

  // ===== COMPUTED =====
  const spyBalance = Number(profile?.spy_balance) || 0
  const usdBalance = spyBalance * SPY_TO_USD

  // Prefer the on-chain connected address, fall back to saved profile wallet
  const walletAddress: string | null =
    connectedAddress || (profile as any)?.wallet_address || null

  const isCorrectChain = chainId === BSC_CHAIN_ID

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

  // ===== DATA FETCHING =====
  const fetchTransactions = useCallback(async () => {
    if (!profile?.id) return
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) {
      console.error('Error fetching transactions:', error)
      return
    }
    setTransactions(data || [])
  }, [profile?.id])

  const fetchAllData = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      await Promise.all([fetchTransactions(), refreshProfile()])
    } catch {
      setError('Failed to load wallet data')
    } finally {
      setRefreshing(false)
    }
  }, [fetchTransactions, refreshProfile])

  useEffect(() => {
    if (profile?.id) fetchAllData()
  }, [profile?.id, fetchAllData])

  // ===== WALLET CONNECT (MetaMask / injected) =====
  const connectWallet = useCallback(async () => {
    const eth = getEthereum()
    if (!eth) {
      toast.error('No Web3 wallet found. Install MetaMask.')
      return
    }
    setIsConnecting(true)
    try {
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' })
      const addr = accounts?.[0]
      if (!addr) throw new Error('No account returned')

      const cid: string = await eth.request({ method: 'eth_chainId' })
      setConnectedAddress(addr)
      setChainId(cid)

      // Persist to profile so server-side withdrawals know the address
      if (profile?.id) {
        await supabase
          .from('profiles')
          .update({ wallet_address: addr.toLowerCase() })
          .eq('id', profile.id)
        await refreshProfile()
      }
      toast.success(`Connected ${shortenAddress(addr)}`)
    } catch (err: any) {
      if (err?.code === 4001) toast.error('Connection rejected')
      else toast.error('Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }, [profile?.id, refreshProfile])

  const disconnectWallet = useCallback(async () => {
    setConnectedAddress(null)
    setChainId(null)
    // Note: injected wallets don't support programmatic disconnect;
    // this just clears local UI state.
    toast.success('Disconnected')
  }, [])

  // Listen for account/chain changes
  useEffect(() => {
    const eth = getEthereum()
    if (!eth?.on) return

    const onAccounts = (accounts: string[]) => setConnectedAddress(accounts?.[0] ?? null)
    const onChain = (cid: string) => setChainId(cid)

    eth.on('accountsChanged', onAccounts)
    eth.on('chainChanged', onChain)
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts)
      eth.removeListener?.('chainChanged', onChain)
    }
  }, [])

  // Auto-detect already-authorized wallet on mount
  useEffect(() => {
    const eth = getEthereum()
    if (!eth) return
    ;(async () => {
      try {
        const accounts: string[] = await eth.request({ method: 'eth_accounts' })
        if (accounts?.[0]) {
          setConnectedAddress(accounts[0])
          const cid: string = await eth.request({ method: 'eth_chainId' })
          setChainId(cid)
        }
      } catch {
        /* ignore */
      }
    })()
  }, [])

  // ===== WITHDRAW =====
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
          userId: profile?.id,
        }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Withdrawal request submitted! 🎉')
        setWithdrawAmount('')
        setWithdrawAddress('')
        setShowSendModal(false)
        await Promise.all([fetchTransactions(), refreshProfile()])
      } else {
        toast.error(data.error || 'Withdrawal failed')
      }
    } catch {
      toast.error('Withdrawal failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [isWithdrawValid, withdrawAmountNum, withdrawAddress, profile?.id, fetchTransactions, refreshProfile])

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }, [])

  const getTransactionIcon = useCallback((type: string) => {
    switch (type) {
      case 'deposit': return FaArrowDown
      case 'withdrawal': return FaArrowUp
      case 'task_reward':
      case 'ad_reward':
      case 'referral_bonus': return FaCoins
      default: return FaClock
    }
  }, [])

  const getTransactionColor = useCallback((type: string) => {
    switch (type) {
      case 'deposit':
      case 'task_reward':
      case 'ad_reward':
      case 'referral_bonus': return 'success'
      case 'withdrawal': return 'danger'
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
    <div className={styles.walletPage}>
      {/* ===== WEB3 MAIN BALANCE CARD ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.balanceCard}
      >
        <div className={styles.balanceCardHeader}>
          <div>
            <p className={styles.balanceCardTitle}>Main Wallet</p>
            <p className={styles.balanceAmount}>
              {showBalance ? `$${usdBalance.toFixed(2)}` : '••••••'}
            </p>
            <p className={styles.balanceSubtitle}>
              {showBalance ? `${spyBalance.toLocaleString()} SPY` : '•••• SPY'}
            </p>
          </div>
          <button
            className={styles.visibilityToggle}
            onClick={() => setShowBalance((v) => !v)}
            aria-label="Toggle balance visibility"
          >
            {showBalance ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* ===== WALLET ADDRESS / CONNECT BAR ===== */}
        <div className={styles.walletAddressBar}>
          {walletAddress ? (
            <>
              <div className={styles.walletAddressChip}>
                <FaLink className={styles.chipIcon} />
                <span title={walletAddress}>{shortenAddress(walletAddress)}</span>
                <button
                  className={styles.chipCopy}
                  onClick={() => copyToClipboard(walletAddress)}
                  aria-label="Copy address"
                >
                  <FaCopy />
                </button>
              </div>

              <div className={`${styles.networkChip} ${isCorrectChain ? styles.networkOk : styles.networkWarn}`}>
                <FaNetworkWired />
                {isCorrectChain ? 'BNB Chain' : 'Wrong network'}
              </div>

              <button className={styles.disconnectBtn} onClick={disconnectWallet}>
                <FaUnlink /> Disconnect
              </button>
            </>
          ) : (
            <button className={styles.connectBtn} onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? <><FaSpinner className={styles.spinning} /> Connecting…</> : <><FaWallet /> Connect Wallet</>}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn} onClick={() => setShowSendModal(true)}>
            <div className={styles.actionBtnIcon}><FaPaperPlane /></div>
            <span>Send</span>
          </button>
          <button className={styles.actionBtn} onClick={() => setShowReceiveModal(true)}>
            <div className={styles.actionBtnIcon}><FaQrcode /></div>
            <span>Receive</span>
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

      {/* ===== ASSETS ===== */}
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
            <p className={styles.assetUsd}>{showBalance ? `$${usdBalance.toFixed(2)}` : '••••'}</p>
          </div>
        </motion.div>
      </div>

      {/* ===== RECENT ACTIVITY ===== */}
      <div className={styles.historyCard}>
        <div className={styles.historyHeader}>
          <h2 className={styles.historyTitle}><FaHistory /> Recent Activity</h2>
          {transactions.length > 0 && <span className={styles.txCount}>{transactions.length}</span>}
        </div>

        {transactions.length > 0 ? (
          <div className={styles.transactionList}>
            {transactions.map((tx) => {
              const Icon = getTransactionIcon(tx.type)
              const color = getTransactionColor(tx.type)
              return (
                <div key={tx.id} className={styles.txRow}>
                  <div className={`${styles.txIconWrapper} ${styles[`txIconWrapper${color[0].toUpperCase()}${color.slice(1)}`] || ''}`}>
                    <Icon className={`${styles.txIcon} ${styles[color] || ''}`} />
                  </div>
                  <div className={styles.txDetails}>
                    <p className={styles.txTitle}>
                      {tx.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <p className={styles.txSubtitle}>{formatDate(tx.created_at)}</p>
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
            <FaHistory className={styles.emptyIcon} />
            <h3>No activity yet</h3>
            <p>Start earning to see your transactions here</p>
            <Link href="/dashboard/earn" className={styles.emptyLink}>Start Earning</Link>
          </div>
        )}
      </div>

      {/* ===== SEND MODAL ===== */}
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
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Send USDT</h2>
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
                    <button className={styles.modalMaxBtn} onClick={() => setWithdrawAmount(String(spyBalance))}>
                      MAX
                    </button>
                  </div>
                  <p className={styles.modalHelper}>Available: {spyBalance.toLocaleString()} SPY</p>
                </div>

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
                  {isLoading ? <><FaSpinner className={styles.spinning} /> Processing…</> : <><FaPaperPlane /> Send Now</>}
                </button>

                <p className={styles.modalMinNote}>
                  Minimum: {MINIMUM_WITHDRAW_SPY} SPY (${(MINIMUM_WITHDRAW_SPY * SPY_TO_USD).toFixed(2)})
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== RECEIVE MODAL — real QR ===== */}
      <AnimatePresence>
        {showReceiveModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={() => setShowReceiveModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Receive SPY</h2>
                <button className={styles.modalClose} onClick={() => setShowReceiveModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.receiveContent}>
                  <div className={styles.qrPlaceholder}>
                    {walletAddress ? (
                      <QRCodeSVG value={walletAddress} size={180} bgColor="transparent" fgColor="#ffffff" />
                    ) : (
                      <FaQrcode />
                    )}
                  </div>
                  <p className={styles.receiveLabel}>Your SPY Wallet Address</p>
                  <div className={styles.receiveAddress}>
                    <code>{walletAddress || 'Connect wallet first'}</code>
                    {walletAddress && (
                      <button className={styles.copyBtn} onClick={() => copyToClipboard(walletAddress)}>
                        <FaCopy /> Copy
                      </button>
                    )}
                  </div>
                  {walletAddress && (
                    <a
                      href={`${BSC_EXPLORER}/address/${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.explorerLink}
                    >
                      View on BscScan <FaExternalLinkAlt />
                    </a>
                  )}
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
