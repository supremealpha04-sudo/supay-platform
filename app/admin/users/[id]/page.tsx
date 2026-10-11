'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  FaArrowLeft, FaUser, FaCoins, FaGem, FaChartLine, 
  FaShieldAlt, FaBan, FaUserCheck
} from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'
import '../users.css'

const supabase = createClient()

interface UserDetail {
  id: string
  username: string
  email: string
  spy_balance: number
  total_earned_usd: number
  total_withdrawn_usd: number
  is_premium: boolean
  premium_until: string
  is_banned: boolean
  referral_code: string
  referral_count: number
  referral_earnings: number
  created_at: string
}

interface Transaction {
  id: string
  type: string
  amount_spy: number
  created_at: string
}

interface NFT {
  id: string
  tier: string
  purchase_price_spy: number
  is_staked: boolean
}

export default function UserDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [nfts, setNfts] = useState<NFT[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserData = useCallback(async () => {
    setIsLoading(true)
    
    const [profileRes, txnsRes, nftsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('transactions').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('user_nfts').select('*, nft_badges(*)').eq('user_id', id),
    ])

    if (profileRes.data) setUser(profileRes.data)
    setTransactions(txnsRes.data || [])
    setNfts(nftsRes.data || [])
    setIsLoading(false)
  }, [id])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const toggleBan = useCallback(async () => {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !user.is_banned })
      .eq('id', id)

    if (!error) {
      toast.success(`User ${user.is_banned ? 'unbanned' : 'banned'} successfully`)
      fetchUserData()
    } else {
      toast.error('Failed to update user')
    }
  }, [user, id, fetchUserData])

  if (isLoading) {
    return (
      <div className="admin-user-detail-loading">
        <div className="admin-user-detail-loading-spinner" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="admin-user-detail-not-found">
        <p>User not found</p>
        <Link href="/admin/users">← Back to Users</Link>
      </div>
    )
  }

  return (
    <div className="admin-user-detail-page">
      {/* Header */}
      <div className="admin-user-detail-header">
        <Link href="/admin/users" className="admin-user-detail-back-btn">
          <FaArrowLeft />
        </Link>
        <div className="admin-user-detail-title-group">
          <h1 className="admin-user-detail-title">{user.username}</h1>
          <p className="admin-user-detail-subtitle">
            User ID: {user.id.slice(0, 8)}...{user.id.slice(-6)}
          </p>
        </div>
        <button
          onClick={toggleBan}
          className={`admin-user-detail-ban-btn ${user.is_banned ? 'unban' : 'ban'}`}
        >
          {user.is_banned ? (
            <><FaUserCheck /> Unban User</>
          ) : (
            <><FaBan /> Ban User</>
          )}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="admin-user-detail-stats-grid">
        <div className="admin-user-detail-stat-card accent">
          <div className="admin-user-detail-stat-icon accent">
            <FaCoins />
          </div>
          <div className="admin-user-detail-stat-content">
            <p className="admin-user-detail-stat-label">SPY Balance</p>
            <p className="admin-user-detail-stat-value">
              {user.spy_balance?.toLocaleString() || 0}
            </p>
            <p className="admin-user-detail-stat-sub">
              ≈ ${((user.spy_balance || 0) / 100).toFixed(2)} USD
            </p>
          </div>
        </div>

        <div className="admin-user-detail-stat-card green">
          <div className="admin-user-detail-stat-icon green">
            <FaChartLine />
          </div>
          <div className="admin-user-detail-stat-content">
            <p className="admin-user-detail-stat-label">Total Earned</p>
            <p className="admin-user-detail-stat-value">
              ${user.total_earned_usd?.toLocaleString() || 0}
            </p>
            <p className="admin-user-detail-stat-sub">All time</p>
          </div>
        </div>

        <div className="admin-user-detail-stat-card purple">
          <div className="admin-user-detail-stat-icon purple">
            <FaGem />
          </div>
          <div className="admin-user-detail-stat-content">
            <p className="admin-user-detail-stat-label">NFTs Owned</p>
            <p className="admin-user-detail-stat-value">{nfts.length}</p>
            <p className="admin-user-detail-stat-sub">
              {nfts.filter(n => n.is_staked).length} staked
            </p>
          </div>
        </div>

        <div className="admin-user-detail-stat-card blue">
          <div className="admin-user-detail-stat-icon blue">
            <FaShieldAlt />
          </div>
          <div className="admin-user-detail-stat-content">
            <p className="admin-user-detail-stat-label">Premium Status</p>
            <p className="admin-user-detail-stat-value">
              {user.is_premium ? 'Active' : 'Inactive'}
            </p>
            {user.premium_until && (
              <p className="admin-user-detail-stat-sub">
                Until {new Date(user.premium_until).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="admin-user-detail-content-grid">
        {/* Account Information */}
        <div className="admin-user-detail-section">
          <h2 className="admin-user-detail-section-title">
            <FaUser /> Account Information
          </h2>
          <div className="admin-user-detail-info-list">
            <div className="admin-user-detail-info-row">
              <span className="admin-user-detail-info-label">Username</span>
              <span className="admin-user-detail-info-value">{user.username}</span>
            </div>
            <div className="admin-user-detail-info-row">
              <span className="admin-user-detail-info-label">Email</span>
              <span className="admin-user-detail-info-value">{user.email}</span>
            </div>
            <div className="admin-user-detail-info-row">
              <span className="admin-user-detail-info-label">Referral Code</span>
              <span className="admin-user-detail-info-value accent">{user.referral_code}</span>
            </div>
            <div className="admin-user-detail-info-row">
              <span className="admin-user-detail-info-label">Referrals</span>
              <span className="admin-user-detail-info-value">{user.referral_count || 0}</span>
            </div>
            <div className="admin-user-detail-info-row">
              <span className="admin-user-detail-info-label">Referral Earnings</span>
              <span className="admin-user-detail-info-value green">
                {user.referral_earnings?.toLocaleString() || 0} SPY
              </span>
            </div>
            <div className="admin-user-detail-info-row">
              <span className="admin-user-detail-info-label">Total Withdrawn</span>
              <span className="admin-user-detail-info-value">
                ${user.total_withdrawn_usd?.toLocaleString() || 0}
              </span>
            </div>
            <div className="admin-user-detail-info-row">
              <span className="admin-user-detail-info-label">Joined</span>
              <span className="admin-user-detail-info-value">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* NFTs Owned */}
        <div className="admin-user-detail-section">
          <h2 className="admin-user-detail-section-title">
            <FaGem /> NFTs Owned
          </h2>
          {nfts.length > 0 ? (
            <div className="admin-user-detail-nft-list">
              {nfts.map((nft) => (
                <div key={nft.id} className="admin-user-detail-nft-item">
                  <div className="admin-user-detail-nft-info">
                    <p className="admin-user-detail-nft-tier">{nft.tier}</p>
                    <p className="admin-user-detail-nft-price">
                      Purchased for {nft.purchase_price_spy} SPY
                    </p>
                  </div>
                  <span className={`admin-user-detail-nft-badge ${nft.is_staked ? 'staked' : 'unstaked'}`}>
                    {nft.is_staked ? 'Staked' : 'Not Staked'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-user-detail-empty">No NFTs owned</p>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="admin-user-detail-transactions">
        <div className="admin-user-detail-transactions-header">
          <h2 className="admin-user-detail-section-title">
            Transaction History
          </h2>
          <span className="admin-user-detail-transactions-count">
            {transactions.length} transactions
          </span>
        </div>
        <div className="admin-user-detail-table-scroll">
          <table className="admin-user-detail-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="admin-user-detail-tx-type">
                    {tx.type.replace(/_/g, ' ')}
                  </td>
                  <td className={`admin-user-detail-tx-amount ${tx.amount_spy > 0 ? 'positive' : 'negative'}`}>
                    {tx.amount_spy > 0 ? '+' : ''}{tx.amount_spy} SPY
                  </td>
                  <td className="admin-user-detail-tx-date">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <p className="admin-user-detail-empty">No transactions found</p>
          )}
        </div>
      </div>
    </div>
  )
}
