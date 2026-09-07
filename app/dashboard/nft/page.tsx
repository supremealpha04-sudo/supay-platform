// app/dashboard/nft/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NFTService } from '@/lib/services/nft-service'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  FaCoins, FaFire, FaGem, FaShoppingCart, FaClock,
  FaCrown, FaStar, FaDiamond, FaMedal, FaTag,
  FaWallet, FaRocket, FaArrowRight
} from 'react-icons/fa'
import { TIER_ICONS, TIER_PRICES, TIER_SUPPLY, TIER_DAILY_REWARD } from '@/types/nft'
import './styles/nft.css'

export default function NFTShowroom() {
  const { user, profile } = useAuth()
  const [badges, setBadges] = useState<any[]>([])
  const [userNFTs, setUserNFTs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, staked: 0, earnings: 0 })
  const [selectedNFT, setSelectedNFT] = useState<any>(null)
  const [showBuyModal, setShowBuyModal] = useState(false)

  useEffect(() => {
    if (user) fetchData()
    else setIsLoading(false)
  }, [user])

  async function fetchData() {
    try {
      const [badgesData, userNFTsData] = await Promise.all([
        NFTService.getBadges(),
        NFTService.getUserNFTs(user!.id)
      ])

      setBadges(badgesData)
      setUserNFTs(userNFTsData)

      const staked = userNFTsData.filter(n => n.is_staked)
      setStats({
        total: userNFTsData.length,
        staked: staked.length,
        earnings: await NFTService.getStakingRewards(user!.id)
      })
    } catch (error) {
      console.error('Error fetching NFT data:', error)
      toast.error('Failed to load NFTs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuy = async (badgeId: string, price: number) => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    if ((profile?.spy_balance || 0) < price) {
      toast.error(`Insufficient SPY. Need ${price.toLocaleString()} SPY`)
      return
    }

    const loading = toast.loading('Purchasing NFT...')
    try {
      const result = await NFTService.mintNFT(user.id, badgeId)
      if (result.success) {
        toast.success('NFT purchased successfully! 🎉', { id: loading })
        fetchData()
        setShowBuyModal(false)
        setSelectedNFT(null)
      } else {
        toast.error(result.error || 'Purchase failed', { id: loading })
      }
    } catch (error) {
      toast.error('Purchase failed', { id: loading })
    }
  }

  const getTierIcon = (tier: string) => {
    const icons: Record<string, string> = {
      Genesis: '👑',
      Legendary: '💎',
      Rare: '⭐',
      Collector: '🟢'
    }
    return icons[tier] || '🏅'
  }

  const getTierClass = (tier: string) => {
    return tier.toLowerCase()
  }

  if (isLoading) {
    return (
      <div className="nft-loading">
        <div className="nft-loading-spinner" />
        <p>Loading NFTs...</p>
      </div>
    )
  }

  return (
    <div className="nft-showroom">
      {/* Hero Section */}
      <div className="nft-hero">
        <div className="nft-hero-content">
          <div className="nft-hero-text">
            <h1><FaGem className="nft-hero-icon" /> Supremeamer NFTs</h1>
            <p>Collect exclusive NFTs and earn rewards</p>
            <div className="nft-hero-stats">
              <span><FaGem className="text-accent-500" /> {badges.length} Collections</span>
              <span><FaFire className="text-orange-400" /> {stats.total} Owned</span>
              <span><FaCoins className="text-green-400" /> {stats.earnings.toFixed(2)} SPY Earned</span>
            </div>
          </div>
          <div className="nft-hero-actions">
            <Link href="/dashboard/nft/staking">
              <button className="nft-btn-primary"><FaFire /> Staking</button>
            </Link>
            <Link href="/dashboard/nft/marketplace">
              <button className="nft-btn-secondary"><FaShoppingCart /> Marketplace</button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="nft-stats-grid">
        <div className="nft-stat-card">
          <FaGem className="text-accent-500 text-xl" />
          <p className="nft-stat-label">Total NFTs</p>
          <p className="nft-stat-value">{stats.total}</p>
        </div>
        <div className="nft-stat-card">
          <FaFire className="text-orange-400 text-xl" />
          <p className="nft-stat-label">Staked</p>
          <p className="nft-stat-value">{stats.staked}</p>
        </div>
        <div className="nft-stat-card">
          <FaCoins className="text-green-400 text-xl" />
          <p className="nft-stat-label">Earnings</p>
          <p className="nft-stat-value">{stats.earnings.toFixed(2)} SPY</p>
        </div>
        <div className="nft-stat-card">
          <FaWallet className="text-blue-400 text-xl" />
          <p className="nft-stat-label">Balance</p>
          <p className="nft-stat-value">{profile?.spy_balance?.toLocaleString() || 0} SPY</p>
        </div>
      </div>

      {/* Available NFTs */}
      <div>
        <h2 className="nft-section-title">Available NFTs</h2>
        <p className="nft-section-subtitle">Purchase NFTs from the Supremeamer collection</p>
        <div className="nft-grid">
          {badges.map((badge) => {
            const isOwned = userNFTs.some(n => n.badge_id === badge.id)
            return (
              <NFTCard 
                key={badge.id} 
                badge={badge} 
                isOwned={isOwned}
                onBuy={() => {
                  setSelectedNFT(badge)
                  setShowBuyModal(true)
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Your NFTs */}
      {userNFTs.length > 0 && (
        <div>
          <h2 className="nft-section-title">Your NFTs</h2>
          <div className="nft-grid">
            {userNFTs.map((nft) => (
              <UserNFTCard key={nft.id} nft={nft} onRefresh={fetchData} />
            ))}
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {showBuyModal && selectedNFT && (
        <div className="nft-modal-overlay" onClick={() => setShowBuyModal(false)}>
          <div className="nft-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nft-modal-header">
              <h2>Confirm Purchase</h2>
              <button onClick={() => setShowBuyModal(false)}>✕</button>
            </div>
            <div className="nft-modal-body">
              <div className="nft-purchase-summary">
                <div className="nft-purchase-item">
                  <span className="nft-purchase-label">NFT</span>
                  <span className="nft-purchase-value">{selectedNFT.name}</span>
                </div>
                <div className="nft-purchase-item">
                  <span className="nft-purchase-label">Tier</span>
                  <span className="nft-purchase-value">{selectedNFT.tier}</span>
                </div>
                <div className="nft-purchase-item">
                  <span className="nft-purchase-label">Price</span>
                  <span className="nft-purchase-value price">
                    <FaCoins className="text-accent-400" /> {selectedNFT.price_spy.toLocaleString()} SPY
                  </span>
                </div>
                <div className="nft-purchase-item">
                  <span className="nft-purchase-label">Your Balance</span>
                  <span className="nft-purchase-value">
                    {(profile?.spy_balance || 0).toLocaleString()} SPY
                  </span>
                </div>
                <div className="nft-purchase-item total">
                  <span className="nft-purchase-label">After Purchase</span>
                  <span className="nft-purchase-value">
                    {(profile?.spy_balance || 0) - selectedNFT.price_spy} SPY
                  </span>
                </div>
              </div>
              <div className="nft-modal-actions">
                <button onClick={() => setShowBuyModal(false)} className="nft-btn-cancel">
                  Cancel
                </button>
                <button 
                  onClick={() => handleBuy(selectedNFT.id, selectedNFT.price_spy)} 
                  className="nft-btn-confirm"
                >
                  Confirm Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ===================== NFT CARD =====================

function NFTCard({ badge, isOwned, onBuy }: { badge: any; isOwned: boolean; onBuy: () => void }) {
  const [isHovered, setIsHovered] = useState(false)

  const tier = badge.tier
  const tierClass = tier.toLowerCase()
  const tierIcon = TIER_ICONS[tier as keyof typeof TIER_ICONS] || '🏅'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`nft-card ${isOwned ? 'owned' : ''}`}
    >
      <div className="nft-card-image">
        {badge.image_url ? (
          <img src={badge.image_url} alt={badge.name} className="nft-card-img" />
        ) : (
          <div className="nft-card-placeholder">{tierIcon}</div>
        )}
        <div className={`nft-tier-badge ${tierClass}`}>{tier}</div>
        {badge.current_supply && (
          <div className="nft-supply-badge">
            {badge.current_supply}/{badge.max_supply}
          </div>
        )}
        {isOwned && (
          <div className="nft-owned-badge">
            <FaGem /> Owned
          </div>
        )}
        <div className={`nft-card-overlay ${isHovered ? 'visible' : ''}`}>
          {!isOwned && (
            <button onClick={onBuy} className="nft-buy-btn-large">
              Buy Now <FaArrowRight />
            </button>
          )}
        </div>
      </div>
      <div className="nft-card-info">
        <div className="nft-card-header">
          <div>
            <h3 className="nft-card-name">{badge.name}</h3>
            <p className="nft-card-type">{tier}</p>
          </div>
          <div className="nft-card-price">
            <FaCoins className="text-accent-400" /> {badge.price_spy.toLocaleString()}
          </div>
        </div>
        <div className="nft-card-meta">
          <span className="nft-card-meta-item">
            <FaClock /> {badge.daily_reward_spy} SPY/day
          </span>
          <span className="nft-card-meta-item">
            <FaTag /> {badge.max_supply} Supply
          </span>
        </div>
        {!isOwned ? (
          <button onClick={onBuy} className="nft-buy-btn">Buy Now</button>
        ) : (
          <Link href="/dashboard/nft/staking" className="nft-stake-btn">
            <FaFire /> Stake
          </Link>
        )}
      </div>
    </motion.div>
  )
}

// ===================== USER NFT CARD =====================

function UserNFTCard({ nft, onRefresh }: { nft: any; onRefresh: () => void }) {
  const { user } = useAuth()
  const [isStaking, setIsStaking] = useState(false)

  const tier = nft.badge?.tier
  const tierClass = tier?.toLowerCase()
  const tierIcon = TIER_ICONS[tier as keyof typeof TIER_ICONS] || '🏅'

  const handleStake = async () => {
    setIsStaking(true)
    try {
      const result = await NFTService.stakeNFT(user!.id, nft.id)
      if (result.success) {
        toast.success('NFT staked! 🚀')
        onRefresh()
      } else {
        toast.error(result.error || 'Failed to stake')
      }
    } catch (error) {
      toast.error('Failed to stake')
    } finally {
      setIsStaking(false)
    }
  }

  const handleUnstake = async () => {
    setIsStaking(true)
    try {
      const result = await NFTService.unstakeNFT(user!.id, nft.id)
      if (result.success) {
        toast.success(`Unstaked! Earned ${result.rewards?.toFixed(2) || 0} SPY`)
        onRefresh()
      } else {
        toast.error(result.error || 'Failed to unstake')
      }
    } catch (error) {
      toast.error('Failed to unstake')
    } finally {
      setIsStaking(false)
    }
  }

  return (
    <div className={`nft-card user-nft ${nft.is_staked ? 'staked' : ''}`}>
      <div className="nft-card-image">
        {nft.badge?.image_url ? (
          <img src={nft.badge.image_url} alt={nft.badge.name} className="nft-card-img" />
        ) : (
          <div className="nft-card-placeholder">{tierIcon}</div>
        )}
        <div className={`nft-tier-badge ${tierClass}`}>{tier}</div>
        {nft.is_staked && (
          <div className="nft-staked-badge"><FaFire /> Staked</div>
        )}
      </div>
      <div className="nft-card-info">
        <h3 className="nft-card-name">{nft.badge?.name}</h3>
        <p className="nft-card-type">#{nft.token_id?.slice(0, 8)}</p>
        <div className="nft-card-actions">
          {nft.is_staked ? (
            <button onClick={handleUnstake} disabled={isStaking} className="nft-action-btn unstake">
              {isStaking ? '...' : 'Unstake'}
            </button>
          ) : (
            <button onClick={handleStake} disabled={isStaking} className="nft-action-btn stake">
              {isStaking ? '...' : 'Stake'}
            </button>
          )}
          <Link href={`/dashboard/nft/${nft.token_id}`} className="nft-action-btn view">
            View
          </Link>
        </div>
      </div>
    </div>
  )
}
