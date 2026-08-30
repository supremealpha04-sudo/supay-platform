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
  FaCoins, FaFire, FaGem, FaShoppingCart, FaPlus, 
  FaStar, FaCrown, FaMedal, FaUser, FaClock
} from 'react-icons/fa'
import { TIER_COLORS, TIER_ICONS, STAKING_APY } from '@/types/nft'
import NFTCard from './components/NFTCard'
import NFTStats from './components/NFTStats'
import NFTFilters from './components/NFTFilters'
import './styles/nft.css'

export default function NFTShowroom() {
  const { user, profile } = useAuth()
  const [badges, setBadges] = useState<any[]>([])
  const [userNFTs, setUserNFTs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, staked: 0, earnings: 0 })
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

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

  const handleRefresh = () => {
    if (user) fetchData()
  }

  if (isLoading) {
    return (
      <div className="nft-loading">
        <div className="nft-loading-spinner" />
        <p>Loading your NFTs...</p>
      </div>
    )
  }

  const filteredBadges = badges.filter(badge => {
    if (filterType !== 'all' && badge.tier.toLowerCase() !== filterType) return false
    if (searchTerm && !badge.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const filteredUserNFTs = userNFTs.filter(nft => {
    if (filterType !== 'all' && nft.badge?.tier.toLowerCase() !== filterType) return false
    if (searchTerm && !nft.badge?.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  return (
    <div className="nft-showroom">
      {/* Hero Section */}
      <div className="nft-hero">
        <div className="nft-hero-content">
          <div className="nft-hero-text">
            <h1>
              <FaGem className="nft-hero-icon" />
              Supremeamer NFTs
            </h1>
            <p>Collect, stake, and earn rewards with exclusive NFTs</p>
            <div className="nft-hero-stats">
              <span><FaGem className="text-accent-500" /> {badges.length} Collections</span>
              <span><FaFire className="text-orange-400" /> {stats.total} Owned</span>
              <span><FaCoins className="text-green-400" /> {stats.earnings.toFixed(2)} SPY Earned</span>
            </div>
          </div>
          <div className="nft-hero-actions">
            <Link href="/dashboard/nft/mint">
              <button className="nft-btn-primary">
                <FaPlus /> Mint NFT
              </button>
            </Link>
            <Link href="/dashboard/nft/staking">
              <button className="nft-btn-secondary">
                <FaFire /> Staking
              </button>
            </Link>
            <Link href="/dashboard/nft/marketplace">
              <button className="nft-btn-secondary">
                <FaShoppingCart /> Marketplace
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <NFTStats stats={stats} />

      {/* Filters */}
      <NFTFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
      />

      {/* Tabs */}
      <div className="nft-tabs">
        <button 
          className={`nft-tab ${activeTab === 'all' ? 'active' : ''}`} 
          onClick={() => setActiveTab('all')}
        >
          All NFTs
        </button>
        <button 
          className={`nft-tab ${activeTab === 'my' ? 'active' : ''}`} 
          onClick={() => setActiveTab('my')}
        >
          My Collection ({userNFTs.length})
        </button>
        <button 
          className={`nft-tab ${activeTab === 'available' ? 'active' : ''}`} 
          onClick={() => setActiveTab('available')}
        >
          Available
        </button>
        <button 
          className={`nft-tab ${activeTab === 'staked' ? 'active' : ''}`} 
          onClick={() => setActiveTab('staked')}
        >
          Staked ({stats.staked})
        </button>
      </div>

      {/* NFT Grid */}
      <div className="nft-grid-container">
        {activeTab === 'all' && (
          <div className="nft-grid">
            {[...userNFTs, ...badges.map(b => ({ ...b, isBadge: true }))].slice(0, 12).map((item, index) => (
              <NFTCard key={item.id || index} nft={item} index={index} isBadge={item.isBadge} />
            ))}
          </div>
        )}

        {activeTab === 'my' && (
          <div className="nft-grid">
            {filteredUserNFTs.length > 0 ? (
              filteredUserNFTs.map((nft, index) => (
                <NFTCard key={nft.id} nft={nft} index={index} />
              ))
            ) : (
              <div className="nft-empty-state">
                <FaGem className="nft-empty-icon" />
                <h3>No NFTs Yet</h3>
                <p>Mint your first NFT to start your collection</p>
                <Link href="/dashboard/nft/mint">
                  <button className="nft-btn-primary">Mint Your First NFT</button>
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'available' && (
          <div className="nft-grid">
            {filteredBadges.length > 0 ? (
              filteredBadges.map((badge, index) => (
                <NFTCard key={badge.id} nft={badge} index={index} isBadge />
              ))
            ) : (
              <div className="nft-empty-state">
                <div className="nft-empty-icon">🎯</div>
                <h3>No NFTs Available</h3>
                <p>Check back later for new collections</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'staked' && (
          <div className="nft-grid">
            {userNFTs.filter(n => n.is_staked).length > 0 ? (
              userNFTs.filter(n => n.is_staked).map((nft, index) => (
                <NFTCard key={nft.id} nft={nft} index={index} />
              ))
            ) : (
              <div className="nft-empty-state">
                <FaFire className="nft-empty-icon" />
                <h3>No Staked NFTs</h3>
                <p>Stake your NFTs to start earning rewards</p>
                <Link href="/dashboard/nft/staking">
                  <button className="nft-btn-primary">Go to Staking</button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
