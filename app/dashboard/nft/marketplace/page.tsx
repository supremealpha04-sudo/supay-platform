// app/dashboard/nft/marketplace/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NFTService } from '@/lib/services/nft-service'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  FaCoins, FaShoppingCart, FaSearch, FaTimes, 
  FaClock, FaUser, FaArrowUp, FaArrowDown,
  FaFilter, FaTag, FaGem, FaFire
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
  const [selectedListing, setSelectedListing] = useState<any>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

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
          <h1><FaShoppingCart className="text-accent-500" /> NFT Marketplace</h1>
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
          {user && (
            <Link href="/dashboard/nft/mint" className="nft-stat-box link">
              <span className="nft-stat-label">Mint New</span>
              <span className="nft-stat-value accent">+</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="nft-marketplace-filters">
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

        <div className="nft-filter-controls">
          <div className="nft-search">
            <FaSearch className="nft-search-icon" />
            <input
              type="text"
              placeholder="Search NFTs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="nft-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="nft-marketplace-grid">
        {sortedListings.length === 0 ? (
          <div className="nft-empty-state">
            <FaShoppingCart className="nft-empty-icon" />
            <h3>No listings available</h3>
            <p>Be the first to list an NFT!</p>
            <Link href="/dashboard/nft/mint">
              <button className="nft-btn-primary">Mint NFT</button>
            </Link>
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
              onViewDetails={() => {
                setSelectedListing(listing)
                // Navigate to NFT detail
              }}
            />
          ))
        )}
      </div>

      {/* My Listings */}
      {myListings.length > 0 && (
        <div className="nft-my-listings">
          <h2>Your Listings ({myListings.length})</h2>
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
        <div className="nft-modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="nft-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nft-modal-header">
              <h2>Confirm Purchase</h2>
              <button onClick={() => setShowPurchaseModal(false)}><FaTimes /></button>
            </div>
            <div className="nft-modal-body">
              <div className="nft-purchase-summary">
                <div className="nft-purchase-item">
                  <span className="nft-purchase-label">NFT</span>
                  <span className="nft-purchase-value">
                    {selectedListing.user_nfts?.badge?.name}
                  </span>
                </div>
                <div className="nft-purchase-item">
                  <span className="nft-purchase-label">Tier</span>
                  <span className="nft-purchase-value">
                    {selectedListing.user_nfts?.badge?.tier}
                  </span>
                </div>
                <div className="nft-purchase-item">
                  <span className="nft-purchase-label">Price</span>
                  <span className="nft-purchase-value price">
                    <FaCoins className="text-accent-400" /> {selectedListing.price_spy.toLocaleString()} SPY
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
                    {(profile?.spy_balance || 0) - selectedListing.price_spy} SPY
                  </span>
                </div>
              </div>
              <div className="nft-modal-actions">
                <button 
                  onClick={() => setShowPurchaseModal(false)} 
                  className="nft-btn-cancel"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleBuy(selectedListing.id, selectedListing.price_spy)} 
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

// ===================== LISTING CARD =====================

function ListingCard({ listing, onBuy, onViewDetails }: any) {
  const badge = listing.user_nfts?.badge
  const isAuction = listing.listing_type === 'auction'

  return (
    <div className="nft-listing-card">
      <div className="nft-listing-image">
        {badge?.image_url ? (
          <img src={badge.image_url} alt={badge.name} className="nft-listing-img" />
        ) : (
          <div className="nft-listing-placeholder">
            {TIER_ICONS[badge?.tier as keyof typeof TIER_ICONS]}
          </div>
        )}
        <div className="nft-listing-tier">
          {badge?.tier}
        </div>
        {isAuction && (
          <div className="nft-listing-badge auction">
            <FaFire /> Auction
          </div>
        )}
      </div>

      <div className="nft-listing-info">
        <div className="nft-listing-header">
          <div>
            <h3 className="nft-listing-name">{badge?.name}</h3>
            <p className="nft-listing-meta">{badge?.tier}</p>
          </div>
          <div className="nft-listing-price">
            <FaCoins className="text-accent-400" />
            {listing.price_spy.toLocaleString()} SPY
          </div>
        </div>

        <div className="nft-listing-footer">
          <span className="nft-listing-date">
            <FaClock /> Listed {new Date(listing.created_at).toLocaleDateString()}
          </span>
          <button onClick={onBuy} className="nft-buy-btn">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  )
}

// ===================== MY LISTING CARD =====================

function MyListingCard({ listing, onCancel, onRefresh }: any) {
  const badge = listing.user_nfts?.badge

  return (
    <div className="nft-my-listing-card">
      <div className="nft-my-listing-content">
        <div className="nft-my-listing-icon">
          {TIER_ICONS[badge?.tier as keyof typeof TIER_ICONS]}
        </div>
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
