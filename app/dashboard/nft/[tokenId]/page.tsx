// app/dashboard/nft/[tokenId]/page.tsx
'use client'  // ✅ MUST BE THE FIRST LINE

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  FaCoins, FaClock, FaFire, FaArrowLeft, FaShare, 
  FaUser, FaShoppingCart, FaPlus, FaTimes,
  FaGem, FaRocket, FaShieldAlt, FaCheck, FaCopy,
  FaTwitter, FaTelegram, FaDiscord, FaLink
} from 'react-icons/fa'
import { NFTService } from '@/lib/services/nft-service'
import { TIER_COLORS, TIER_ICONS, STAKING_APY } from '@/types/nft'
import '../styles/nft.css'

const supabase = createClient()

export default function NFTDetail() {
  const { tokenId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [nft, setNft] = useState<any>(null)
  const [listing, setListing] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [showListModal, setShowListModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [listPrice, setListPrice] = useState('')
  const [transferAddress, setTransferAddress] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (tokenId) fetchNFT()
  }, [tokenId])

  async function fetchNFT() {
    try {
      const data = await NFTService.getNFTByTokenId(tokenId as string)
      if (!data) {
        toast.error('NFT not found')
        router.push('/dashboard/nft')
        return
      }
      setNft(data)

      const { data: listingData } = await supabase
        .from('nft_listings')
        .select('*')
        .eq('nft_id', data.id)
        .eq('status', 'active')
        .maybeSingle()

      setListing(listingData)
    } catch (error) {
      console.error('Error fetching NFT:', error)
      toast.error('Failed to load NFT')
      router.push('/dashboard/nft')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStake = async () => {
    if (!user) { toast.error('Please login'); return }
    const loading = toast.loading('Staking NFT...')
    try {
      const result = await NFTService.stakeNFT(user.id, nft.id)
      if (result.success) {
        toast.success('NFT staked! 🚀', { id: loading })
        fetchNFT()
        setShowStakeModal(false)
      } else {
        toast.error(result.error || 'Failed to stake', { id: loading })
      }
    } catch (error) {
      toast.error('Failed to stake', { id: loading })
    }
  }

  const handleUnstake = async () => {
    if (!user) { toast.error('Please login'); return }
    const loading = toast.loading('Unstaking NFT...')
    try {
      const result = await NFTService.unstakeNFT(user.id, nft.id)
      if (result.success) {
        toast.success(`Unstaked! Earned ${result.rewards?.toFixed(2) || 0} SPY`, { id: loading })
        fetchNFT()
      } else {
        toast.error(result.error || 'Failed to unstake', { id: loading })
      }
    } catch (error) {
      toast.error('Failed to unstake', { id: loading })
    }
  }

  const handleList = async () => {
    if (!user) { toast.error('Please login'); return }
    if (!listPrice || parseFloat(listPrice) <= 0) {
      toast.error('Please enter a valid price')
      return
    }

    const loading = toast.loading('Creating listing...')
    try {
      const result = await NFTService.listNFT(user.id, nft.id, parseFloat(listPrice))
      if (result.success) {
        toast.success('NFT listed!', { id: loading })
        fetchNFT()
        setShowListModal(false)
        setListPrice('')
      } else {
        toast.error(result.error || 'Failed to list', { id: loading })
      }
    } catch (error) {
      toast.error('Failed to list', { id: loading })
    }
  }

  const handleCancelListing = async () => {
    const loading = toast.loading('Cancelling listing...')
    try {
      const response = await fetch('/api/nft/marketplace/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Listing cancelled', { id: loading })
        fetchNFT()
      } else {
        toast.error('Failed to cancel', { id: loading })
      }
    } catch (error) {
      toast.error('Failed to cancel', { id: loading })
    }
  }

  const handleCopyTokenId = () => {
    navigator.clipboard.writeText(nft.token_id)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success('Token ID copied!')
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = `Check out this ${nft.badge?.tier} NFT: ${nft.badge?.name}`
    
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      discord: `https://discord.com/channels/@me`,
      copy: 'copy'
    }

    if (platform === 'copy') {
      navigator.clipboard.writeText(url)
      toast.success('Link copied!')
      return
    }

    const shareUrl = shareUrls[platform]
    if (shareUrl) {
      window.open(shareUrl, '_blank')
    }
  }

  const isOwner = user?.id === nft?.user_id

  if (isLoading) {
    return (
      <div className="nft-loading">
        <div className="nft-loading-spinner" />
        <p>Loading NFT...</p>
      </div>
    )
  }

  if (!nft) {
    return (
      <div className="nft-empty-state">
        <div className="nft-empty-icon">❌</div>
        <h3>NFT not found</h3>
        <p>The NFT you're looking for doesn't exist</p>
        <Link href="/dashboard/nft">
          <button className="nft-btn-primary">Back to NFTs</button>
        </Link>
      </div>
    )
  }

  const badge = nft.badge

  return (
    <div className="nft-detail-page">
      <button onClick={() => router.back()} className="nft-back-btn">
        <FaArrowLeft /> Back
      </button>

      <div className="nft-detail-grid">
        {/* Image */}
        <div className="nft-detail-image-wrapper">
          <div className="nft-detail-image">
            {badge?.image_url ? (
              <Image
                src={badge.image_url}
                alt={badge.name}
                width={600}
                height={600}
                className="nft-detail-img"
              />
            ) : (
              <div className="nft-detail-placeholder">
                {TIER_ICONS[badge?.tier as keyof typeof TIER_ICONS]}
              </div>
            )}
            <div className={`nft-detail-tier ${badge?.tier?.toLowerCase()}`}>
              {badge?.tier}
            </div>
            {nft.is_staked && (
              <div className="nft-detail-staked">
                <FaFire /> Staked
              </div>
            )}
            {listing && (
              <div className="nft-detail-listed">
                <FaShoppingCart /> Listed
              </div>
            )}
          </div>

          {/* Share Actions */}
          <div className="nft-detail-share">
            <button onClick={() => handleShare('twitter')} className="nft-share-btn twitter">
              <FaTwitter />
            </button>
            <button onClick={() => handleShare('telegram')} className="nft-share-btn telegram">
              <FaTelegram />
            </button>
            <button onClick={() => handleShare('discord')} className="nft-share-btn discord">
              <FaDiscord />
            </button>
            <button onClick={() => handleShare('copy')} className="nft-share-btn copy">
              <FaLink />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="nft-detail-info">
          <div className="nft-detail-header">
            <h1 className="nft-detail-name">{badge?.name}</h1>
            <div className="nft-detail-token-id" onClick={handleCopyTokenId}>
              #{nft.token_id?.slice(0, 8)}...
              {isCopied ? <FaCheck className="text-green-400" /> : <FaCopy />}
            </div>
          </div>

          <p className="nft-detail-description">{badge?.description}</p>

          <div className="nft-detail-stats">
            <div className="nft-detail-stat">
              <span className="nft-detail-stat-label">Price</span>
              <span className="nft-detail-stat-value">
                <FaCoins /> {badge?.price_spy?.toLocaleString() || 0} SPY
              </span>
            </div>
            <div className="nft-detail-stat">
              <span className="nft-detail-stat-label">Daily Reward</span>
              <span className="nft-detail-stat-value">
                {badge?.daily_reward_spy || 0} SPY
              </span>
            </div>
            <div className="nft-detail-stat">
              <span className="nft-detail-stat-label">APY</span>
              <span className="nft-detail-stat-value">
                {STAKING_APY[badge?.tier as keyof typeof STAKING_APY] || 0}%
              </span>
            </div>
            <div className="nft-detail-stat">
              <span className="nft-detail-stat-label">Minted</span>
              <span className="nft-detail-stat-value">
                <FaClock /> {new Date(nft.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="nft-detail-actions">
            {isOwner ? (
              <>
                {nft.is_staked ? (
                  <button onClick={handleUnstake} className="nft-action-btn unstake">
                    <FaFire /> Unstake
                  </button>
                ) : (
                  <button onClick={() => setShowStakeModal(true)} className="nft-action-btn stake">
                    <FaPlus /> Stake
                  </button>
                )}
                {listing ? (
                  <button onClick={handleCancelListing} className="nft-action-btn cancel">
                    <FaTimes /> Cancel Listing
                  </button>
                ) : (
                  <button onClick={() => setShowListModal(true)} className="nft-action-btn list">
                    <FaShoppingCart /> List for Sale
                  </button>
                )}
              </>
            ) : (
              <button className="nft-action-btn buy">
                <FaShoppingCart /> Buy Now
              </button>
            )}
          </div>

          {/* Owner Info */}
          <div className="nft-detail-owner">
            <div className="nft-detail-owner-avatar">
              <FaUser />
            </div>
            <div>
              <p className="nft-detail-owner-label">Owner</p>
              <p className="nft-detail-owner-address">
                {nft.user_id?.slice(0, 10)}...{nft.user_id?.slice(-8)}
              </p>
            </div>
            {isOwner && (
              <span className="nft-detail-owner-badge">
                <FaCheck /> You
              </span>
            )}
          </div>

          {/* Verification */}
          <div className="nft-detail-verification">
            <FaShieldAlt className="text-accent-500" />
            <span>
              Verified NFT • {nft.is_staked ? 'Staked' : 'Available'} • 
              <strong> {badge?.tier}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Stake Modal */}
      {showStakeModal && (
        <div className="nft-modal-overlay" onClick={() => setShowStakeModal(false)}>
          <div className="nft-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nft-modal-header">
              <h2>Stake NFT</h2>
              <button onClick={() => setShowStakeModal(false)}><FaTimes /></button>
            </div>
            <div className="nft-modal-body">
              <div className="nft-stake-summary">
                <div className="nft-stake-summary-item">
                  <span>NFT</span>
                  <span>{badge?.name}</span>
                </div>
                <div className="nft-stake-summary-item">
                  <span>Tier</span>
                  <span>{badge?.tier}</span>
                </div>
                <div className="nft-stake-summary-item">
                  <span>APY</span>
                  <span className="text-green-400">
                    {STAKING_APY[badge?.tier as keyof typeof STAKING_APY] || 0}%
                  </span>
                </div>
                <div className="nft-stake-summary-item">
                  <span>Daily Reward</span>
                  <span>{badge?.daily_reward_spy || 0} SPY</span>
                </div>
              </div>
              <div className="nft-modal-actions">
                <button onClick={() => setShowStakeModal(false)} className="nft-btn-cancel">
                  Cancel
                </button>
                <button onClick={handleStake} className="nft-btn-confirm">
                  Confirm Stake
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List Modal */}
      {showListModal && (
        <div className="nft-modal-overlay" onClick={() => setShowListModal(false)}>
          <div className="nft-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nft-modal-header">
              <h2>List NFT for Sale</h2>
              <button onClick={() => setShowListModal(false)}><FaTimes /></button>
            </div>
            <div className="nft-modal-body">
              <div className="nft-list-form">
                <div className="nft-list-field">
                  <label>Price (SPY)</label>
                  <input
                    type="number"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                    placeholder="Enter price in SPY"
                    min="0"
                  />
                </div>
                <div className="nft-list-note">
                  <p>💡 Platform fee: 2.5% on sale</p>
                </div>
              </div>
              <div className="nft-modal-actions">
                <button onClick={() => setShowListModal(false)} className="nft-btn-cancel">
                  Cancel
                </button>
                <button onClick={handleList} className="nft-btn-confirm">
                  List NFT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
