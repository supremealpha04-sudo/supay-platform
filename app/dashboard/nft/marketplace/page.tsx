'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NFTService } from '@/lib/services/nft-service'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  FaCoins, FaShoppingCart, FaSearch, FaTimes, 
  FaClock, FaGem, FaFire, FaStar, FaCrown, 
  FaMedal, FaRocket, FaArrowRight, FaFilter,
  FaThLarge, FaListUl, FaSlidersH, FaChevronDown,
  FaHeart, FaShare, FaEye
} from 'react-icons/fa'
import { TIER_ICONS } from '@/types/nft'
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
      <div className="marketplace-loading">
        <div className="marketplace-loading-spinner" />
        <p>Loading marketplace...</p>
      </div>
    )
  }

  return (
    <div className="marketplace-container">
      {/* ====== HERO HEADER ====== */}
      <div className="marketplace-hero">
        <div className="marketplace-hero-content">
          <div>
            <h1 className="marketplace-hero-title">
              <FaShoppingCart className="marketplace-hero-icon" />
              NFT Marketplace
            </h1>
            <p className="marketplace-hero-subtitle">Buy and sell premium NFTs securely</p>
          </div>
          <div className="marketplace-hero-stats">
            <div className="marketplace-stat">
              <span className="marketplace-stat-label">Listings</span>
              <span className="marketplace-stat-value">{listings.length}</span>
            </div>
            <div className="marketplace-stat">
              <span className="marketplace-stat-label">Balance</span>
              <span className="marketplace-stat-value accent">
                {profile?.spy_balance?.toLocaleString() || 0} SPY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ====== FILTERS ====== */}
      <div className="marketplace-filters">
        <div className="marketplace-filters-left">
          <div className="marketplace-tier-tabs">
            <button 
              className={`tier-tab ${filterTier === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTier('all')}
            >
              All
            </button>
            <button 
              className={`tier-tab ${filterTier === 'genesis' ? 'active' : ''}`}
              onClick={() => setFilterTier('genesis')}
            >
              👑 Genesis
            </button>
            <button 
              className={`tier-tab ${filterTier === 'legendary' ? 'active' : ''}`}
              onClick={() => setFilterTier('legendary')}
            >
              💎 Legendary
            </button>
            <button 
              className={`tier-tab ${filterTier === 'rare' ? 'active' : ''}`}
              onClick={() => setFilterTier('rare')}
            >
              ⭐ Rare
            </button>
            <button 
              className={`tier-tab ${filterTier === 'collector' ? 'active' : ''}`}
              onClick={() => setFilterTier('collector')}
            >
              🟢 Collector
            </button>
          </div>

          <div className="marketplace-view-toggle">
            <button 
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <FaThLarge />
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <FaListUl />
            </button>
          </div>
        </div>

        <div className="marketplace-filters-right">
          <div className="marketplace-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search NFTs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes />
              </button>
            )}
          </div>
          <select 
            className="marketplace-sort"
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

      {/* ====== RESULTS COUNT ====== */}
      <div className="marketplace-results">
        <span>{sortedListings.length} NFTs found</span>
      </div>

      {/* ====== LISTINGS ====== */}
      {viewMode === 'grid' ? (
        <div className="marketplace-grid">
          {sortedListings.length === 0 ? (
            <div className="marketplace-empty">
              <FaShoppingCart className="empty-icon" />
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
        <div className="marketplace-list">
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

      {/* ====== MY LISTINGS ====== */}
      {myListings.length > 0 && (
        <div className="my-listings">
          <div className="my-listings-header">
            <h2>Your Listings ({myListings.length})</h2>
          </div>
          <div className="my-listings-grid">
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

      {/* ====== PURCHASE MODAL ====== */}
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

// ===================== LISTING CARD =====================

function ListingCard({ listing, onBuy }: any) {
  const badge = listing.user_nfts?.badge
  const isGenesis = badge?.tier === 'Genesis'
  const tierIcon = TIER_ICONS[badge?.tier as keyof typeof TIER_ICONS] || '🏅'
  const tierClass = badge?.tier?.toLowerCase() || 'collector'
  const [isHovered, setIsHovered] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`listing-card ${isGenesis ? 'premium' : ''}`}
    >
      <div className="listing-card-image">
        {badge?.image_url ? (
          <img src={badge.image_url} alt={badge.name} className="listing-card-img" />
        ) : (
          <div className="listing-card-placeholder">{tierIcon}</div>
        )}
        <div className={`listing-card-tier ${tierClass}`}>{badge?.tier}</div>
        {isGenesis && (
          <div className="listing-card-premium">
            <FaCrown /> Premium
          </div>
        )}
        <div className="listing-card-id">#{listing.id.slice(0, 6)}</div>
        
        {/* Hover Actions */}
        <div className={`listing-card-hover ${isHovered ? 'visible' : ''}`}>
          <button className="hover-btn" onClick={() => setIsLiked(!isLiked)}>
            <FaHeart className={isLiked ? 'liked' : ''} />
          </button>
          <button className="hover-btn">
            <FaShare />
          </button>
          <button className="hover-btn">
            <FaEye />
          </button>
        </div>
      </div>

      <div className="listing-card-info">
        <div className="listing-card-header">
          <div>
            <h3 className="listing-card-name">{badge?.name}</h3>
            <p className="listing-card-meta">
              <span className={`listing-card-tier-label ${tierClass}`}>{badge?.tier}</span>
              <span className="listing-card-divider">•</span>
              <span className="listing-card-date">
                <FaClock /> {new Date(listing.created_at).toLocaleDateString()}
              </span>
            </p>
          </div>
          <div className="listing-card-price">
            <FaCoins className="price-icon" />
            {listing.price_spy.toLocaleString()} SPY
          </div>
        </div>

        <div className="listing-card-footer">
          <button onClick={onBuy} className="buy-btn">
            Buy Now <FaArrowRight className="btn-arrow" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ===================== LISTING ROW =====================

function ListingRow({ listing, onBuy }: any) {
  const badge = listing.user_nfts?.badge
  const tierIcon = TIER_ICONS[badge?.tier as keyof typeof TIER_ICONS] || '🏅'
  const tierClass = badge?.tier?.toLowerCase() || 'collector'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="listing-row"
    >
      <div className="listing-row-image">
        {badge?.image_url ? (
          <img src={badge.image_url} alt={badge.name} className="listing-row-img" />
        ) : (
          <div className="listing-row-placeholder">{tierIcon}</div>
        )}
        <div className={`listing-row-tier ${tierClass}`}>{badge?.tier}</div>
      </div>
      <div className="listing-row-info">
        <h4 className="listing-row-name">{badge?.name}</h4>
        <p className="listing-row-meta">
          <FaClock /> Listed {new Date(listing.created_at).toLocaleDateString()}
        </p>
      </div>
      <div className="listing-row-price">
        <FaCoins className="price-icon" />
        {listing.price_spy.toLocaleString()} SPY
      </div>
      <button onClick={onBuy} className="listing-row-buy">
        Buy
      </button>
    </motion.div>
  )
}

// ===================== MY LISTING CARD =====================

function MyListingCard({ listing, onCancel }: any) {
  const badge = listing.user_nfts?.badge
  const tierIcon = TIER_ICONS[badge?.tier as keyof typeof TIER_ICONS] || '🏅'

  return (
    <div className="my-listing-card">
      <div className="my-listing-content">
        <div className="my-listing-icon">{tierIcon}</div>
        <div className="my-listing-info">
          <h4>{badge?.name}</h4>
          <p>{listing.price_spy.toLocaleString()} SPY</p>
        </div>
        <button onClick={onCancel} className="cancel-btn">
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
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Confirm Purchase</h2>
          <button onClick={onClose} className="modal-close"><FaTimes /></button>
        </div>
        <div className="modal-body">
          <div className="purchase-summary">
            <div className="purchase-item">
              <span className="purchase-label">NFT</span>
              <span className="purchase-value">{badge?.name}</span>
            </div>
            <div className="purchase-item">
              <span className="purchase-label">Tier</span>
              <span className="purchase-value">{badge?.tier} {tierIcon}</span>
            </div>
            <div className="purchase-item">
              <span className="purchase-label">Price</span>
              <span className="purchase-value price">
                <FaCoins className="price-icon" /> {listing.price_spy.toLocaleString()} SPY
              </span>
            </div>
            <div className="purchase-item">
              <span className="purchase-label">Your Balance</span>
              <span className="purchase-value">{balance.toLocaleString()} SPY</span>
            </div>
            <div className="purchase-item total">
              <span className="purchase-label">After Purchase</span>
              <span className="purchase-value">{balance - listing.price_spy} SPY</span>
            </div>
          </div>
          <div className="modal-actions">
            <button onClick={onClose} className="btn-cancel">Cancel</button>
            <button onClick={onConfirm} className="btn-confirm">Confirm Purchase</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
