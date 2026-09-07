// app/dashboard/nft/marketplace/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NFTService } from '@/lib/services/nft-service'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  FaCoins, FaShoppingCart, FaSearch, FaTimes, 
  FaClock, FaUser, FaArrowUp, FaArrowDown,
  FaFilter, FaTag, FaGem, FaFire, FaStar,
  FaCrown, FaDiamond, FaMedal, FaRocket,
  FaShieldAlt, FaCheck, FaExclamationCircle,
  FaListUl, FaThLarge, FaSlidersH
} from 'react-icons/fa'
import { TIER_COLORS, TIER_ICONS } from '@/types/nft'
import '../styles/marketplace.css'

export default function Marketplace() {
  const { user, profile } = useAuth()
  const [listings, setListings] = useState<any[]>([])
  const [myListings, setMyListings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedListing, setSelectedListing] = useState<any>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchListings()
    if (user) fetchMyListings()
  }, [user])

  async function fetchListings() {
    try {
      const data = await NFTService.getListings()
      setListings(data || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
      toast.error('Failed to load marketplace')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchMyListings() {
    try {
      const allListings = await NFTService.getListings()
      setMyListings(allListings.filter((l: any) => l.seller_id === user?.id))
    } catch (error) {
      console.error('Error fetching my listings:', error)
    }
  }

  const handleBuy = async (listingId: string, price: number) => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    if ((profile?.spy_balance || 0) < price) {
      toast.error(`Insufficient SPY. Need ${price.toLocaleString()} SPY`)
      return
    }

    const loading = toast.loading('Processing purchase...')
    try {
      const result = await NFTService.buyNFT(user.id, listingId)
      if (result.success) {
        toast.success('NFT purchased successfully! 🎉', { id: loading })
        fetchListings()
        fetchMyListings()
        setShowPurchaseModal(false)
        setSelectedListing(null)
      } else {
        toast.error(result.error || 'Purchase failed', { id: loading })
      }
    } catch (error) {
      toast.error('Purchase failed', { id: loading })
    }
  }

  const handleCancelListing = async (listingId: string) => {
    const loading = toast.loading('Cancelling listing...')
    try {
      const response = await fetch('/api/nft/marketplace/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Listing cancelled', { id: loading })
        fetchMyListings()
      } else {
        toast.error('Failed to cancel', { id: loading })
      }
    } catch (error) {
      toast.error('Failed to cancel', { id: loading })
    }
  }

  const filteredListings = listings.filter(listing => {
    if (filterTier !== 'all' && listing.user_nfts?.badge?.tier.toLowerCase() !== filterTier) return false
    if (searchTerm && !listing.user_nfts?.badge?.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'price_low') return a.price_spy - b.price_spy
    if (sortBy === 'price_high') return b.price_spy - a.price_spy
    if (sortBy === 'popular') return (b.user_nfts?.badge?.tier === 'Genesis' ? 1 : 0) - (a.user_nfts?.badge?.tier === 'Genesis' ? 1 : 0)
    return 0
  })

  if (isLoading) {
    return (
      <div className="nft-loading">
        <div className="nft-loading-spinner" />
        <p>Loading marketplace...</p>
      </div>
    )
  }

  return (
    <div className="nft-marketplace">
      {/* Header */}
      <div className="nft-marketplace-header">
        <div>
          <h1>
            <FaShoppingCart className="text-accent-500" />
            NFT Marketplace
          </h1>
          <p>Buy and sell NFTs securely</p>
        </div>
        <div className="nft-marketplace-stats">
          <div className="nft-stat-box">
            <span className="nft-stat-label">Listings</span>
            <span className="nft-stat-value">{listings.length}</span>
          </div>
          <div className="nft-stat-box">
            <span className="nft-stat-label">Balance</span>
            <span className="nft-stat-value accent">
              {profile?.spy_balance?.toLocaleString() || 0} SPY
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="nft-marketplace-filters">
        <div className="nft-filter-left">
          <div className="nft-filter-group">
            <button 
              className={`nft-filter-btn ${filterTier === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTier('all')}
            >
              All
            </button>
            <button 
              className={`nft-filter-btn ${filterTier === 'genesis' ? 'active' : ''}`}
              onClick={() => setFilterTier('genesis')}
            >
              <span className="nft-filter-icon">👑</span> Genesis
            </button>
            <button 
              className={`nft-filter-btn ${filterTier === 'legendary' ? 'active' : ''}`}
              onClick={() => setFilterTier('legendary')}
            >
              <span className="nft-filter-icon">💎</span> Legendary
            </button>
            <button 
              className={`nft-filter-btn ${filterTier === 'rare' ? 'active' : ''}`}
              onClick={() => setFilterTier('rare')}
            >
              <span className="nft-filter-icon">⭐</span> Rare
            </button>
            <button 
              className={`nft-filter-btn ${filterTier === 'collector' ? 'active' : ''}`}
              onClick={() => setFilterTier('collector')}
            >
              <span className="nft-filter-icon">🟢</span> Collector
            </button>
          </div>

          <div className="nft-view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <FaThLarge />
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <FaListUl />
            </button>
          </div>
        </div>

        <div className="nft-filter-right">
          <div className="nft-search">
            <FaSearch className="nft-search-icon" />
            <input
              type="text"
              placeholder="Search NFTs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="nft-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes />
              </button>
            )}
          </div>
          <select 
            className="nft-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low → High</option>
            <option value="price_high">Price: High → Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="nft-results-count">
        <span>{sortedListings.length} NFTs found</span>
      </div>

      {/* Listings Grid */}
      {viewMode === 'grid' ? (
        <div className="nft-marketplace-grid">
          {sortedListings.length === 0 ? (
            <div className="nft-empty-state">
              <FaShoppingCart className="nft-empty-icon" />
              <h3>No listings available</h3>
              <p>Be the first to list an NFT!</p>
            </div>
          ) : (
            sortedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onBuy={() => {
                  setSelectedListing(listing)
                  setShowPurchaseModal(true)
                }}
              />
            ))
          )}
        </div>
      ) : (
        <div className="nft-list-view">
          {sortedListings.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              onBuy={() => {
                setSelectedListing(listing)
                setShowPurchaseModal(true)
              }}
            />
          ))}
        </div>
      )}

      {/* My Listings */}
      {myListings.length > 0 && (
        <div className="nft-my-listings">
          <div className="nft-my-listings-header">
            <h2>Your Listings ({myListings.length})</h2>
          </div>
          <div className="nft-my-listings-grid">
            {myListings.map((listing) => (
              <MyListingCard 
                key={listing.id} 
                listing={listing} 
                onCancel={() => handleCancelListing(listing.id)}
                onRefresh={fetchMyListings}
              />
            ))}
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedListing && (
        <PurchaseModal 
          listing={selectedListing}
          onClose={() => setShowPurchaseModal(false)}
          onConfirm={() => handleBuy(selectedListing.id, selectedListing.price_spy)}
          balance={profile?.spy_balance || 0}
        />
      )}
    </div>
  )
}

// ===================== LISTING CARD (Grid View) =====================

function ListingCard({ listing, onBuy }: any) {
  const badge = listing.user_nfts?.badge
  const isGenesis = badge?.tier === 'Genesis'
  const tierIcon = TIER_ICONS[badge?.tier as keyof typeof TIER_ICONS] || '🏅'
  const tierClass = badge?.tier?.toLowerCase() || 'collector'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`nft-listing-card ${isGenesis ? 'premium' : ''}`}
    >
      <div className="nft-listing-image">
        {badge?.image_url ? (
          <img src={badge.image_url} alt={badge.name} className="nft-listing-img" />
        ) : (
          <div className="nft-listing-placeholder">{tierIcon}</div>
        )}
        <div className={`nft-listing-tier ${tierClass}`}>{badge?.tier}</div>
        {isGenesis && (
          <div className="nft-listing-premium-badge">
            <FaCrown /> Premium
          </div>
        )}
        <div className="nft-listing-id">#{listing.id.slice(0, 6)}</div>
      </div>

      <div className="nft-listing-info">
        <div className="nft-listing-header">
          <div>
            <h3 className="nft-listing-name">{badge?.name}</h3>
            <p className="nft-listing-meta">
              <span className="nft-listing-tier-label">{badge?.tier}</span>
              <span className="nft-listing-divider">•</span>
              <span className="nft-listing-date">
                <FaClock /> {new Date(listing.created_at).toLocaleDateString()}
              </span>
            </p>
          </div>
          <div className="nft-listing-price">
            <FaCoins className="text-accent-400" />
            {listing.price_spy.toLocaleString()} SPY
          </div>
        </div>

        <div className="nft-listing-footer">
          <button onClick={onBuy} className="nft-buy-btn">
            Buy Now <FaArrowRight />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ===================== LISTING ROW (List View) =====================

function ListingRow({ listing, onBuy }: any) {
  const badge = listing.user_nfts?.badge
  const tierIcon = TIER_ICONS[badge?.tier as keyof typeof TIER_ICONS] || '🏅'
  const tierClass = badge?.tier?.toLowerCase() || 'collector'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="nft-listing-row"
    >
      <div className="nft-listing-row-image">
        {badge?.image_url ? (
          <img src={badge.image_url} alt={badge.name} className="nft-listing-row-img" />
        ) : (
          <div className="nft-listing-row-placeholder">{tierIcon}</div>
        )}
        <div className={`nft-listing-row-tier ${tierClass}`}>{badge?.tier}</div>
      </div>
      <div className="nft-listing-row-info">
        <h4 className="nft-listing-row-name">{badge?.name}</h4>
        <p className="nft-listing-row-meta">
          <FaClock /> Listed {new Date(listing.created_at).toLocaleDateString()}
        </p>
      </div>
      <div className="nft-listing-row-price">
        <FaCoins className="text-accent-400" />
        {listing.price_spy.toLocaleString()} SPY
      </div>
      <button onClick={onBuy} className="nft-listing-row-buy">
        Buy
      </button>
    </motion.div>
  )
}

// ===================== MY LISTING CARD =====================

function MyListingCard({ listing, onCancel, onRefresh }: any) {
  const badge = listing.user_nfts?.badge
  const tierIcon = TIER_ICONS[badge?.tier as keyof typeof TIER_ICONS] || '🏅'

  return (
    <div className="nft-my-listing-card">
      <div className="nft-my-listing-content">
        <div className="nft-my-listing-icon">{tierIcon}</div>
        <div className="nft-my-listing-info">
          <h4>{badge?.name}</h4>
          <p>{listing.price_spy.toLocaleString()} SPY</p>
        </div>
        <button onClick={onCancel} className="nft-cancel-btn">
          <FaTimes />
        </button>
      </div>
    </div>
  )
}

// ===================== PURCHASE MODAL =====================

function PurchaseModal({ listing, onClose, onConfirm, balance }: any) {
  const badge = listing.user_nfts?.badge
  const tierIcon = TIER_ICONS[badge?.tier as keyof typeof TIER_ICONS] || '🏅'

  return (
    <div className="nft-modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="nft-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="nft-modal-header">
          <h2>Confirm Purchase</h2>
          <button onClick={onClose}><FaTimes /></button>
        </div>
        <div className="nft-modal-body">
          <div className="nft-purchase-summary">
            <div className="nft-purchase-item">
              <span className="nft-purchase-label">NFT</span>
              <span className="nft-purchase-value">{badge?.name}</span>
            </div>
            <div className="nft-purchase-item">
              <span className="nft-purchase-label">Tier</span>
              <span className="nft-purchase-value">{badge?.tier} {tierIcon}</span>
            </div>
            <div className="nft-purchase-item">
              <span className="nft-purchase-label">Price</span>
              <span className="nft-purchase-value price">
                <FaCoins className="text-accent-400" /> {listing.price_spy.toLocaleString()} SPY
              </span>
            </div>
            <div className="nft-purchase-item">
              <span className="nft-purchase-label">Your Balance</span>
              <span className="nft-purchase-value">{balance.toLocaleString()} SPY</span>
            </div>
            <div className="nft-purchase-item total">
              <span className="nft-purchase-label">After Purchase</span>
              <span className="nft-purchase-value">{balance - listing.price_spy} SPY</span>
            </div>
          </div>
          <div className="nft-modal-actions">
            <button onClick={onClose} className="nft-btn-cancel">
              Cancel
            </button>
            <button onClick={onConfirm} className="nft-btn-confirm">
              Confirm Purchase
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
