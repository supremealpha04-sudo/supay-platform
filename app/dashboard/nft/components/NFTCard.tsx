// app/dashboard/nft/components/NFTCard.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { NFTService } from '@/lib/services/nft-service'
import { FaCoins, FaClock, FaHeart, FaShare, FaFire, FaGem, FaArrowRight } from 'react-icons/fa'
import { TIER_COLORS, TIER_ICONS, STAKING_APY } from '@/types/nft'
import '../styles/nft.css'

export default function NFTCard({ nft, index, isBadge }: { nft: any; index: number; isBadge?: boolean }) {
  const { user, profile } = useAuth()
  const [isHovered, setIsHovered] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const tier = nft.tier || nft.badge?.tier || 'Collector'
  const imageUrl = nft.image_url || nft.badge?.image_url
  const name = nft.name || nft.badge?.name || 'Supremeamer NFT'
  const description = nft.description || nft.badge?.description || 'Premium NFT collection'
  const price = nft.price_spy || nft.badge?.price_spy || 0
  const dailyReward = nft.daily_reward_spy || nft.badge?.daily_reward_spy || 0
  const isOwned = nft.user_id === user?.id || nft.is_staked !== undefined
  const isStaked = nft.is_staked || false

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    if ((profile?.spy_balance || 0) < price) {
      toast.error(`Insufficient SPY. Need ${price.toLocaleString()} SPY`)
      return
    }

    setIsPurchasing(true)
    try {
      const result = await NFTService.mintNFT(user.id, nft.id || nft.badge_id)
      if (result.success) {
        toast.success(`🎉 ${tier} NFT purchased!`)
        window.location.reload()
      } else {
        toast.error(result.error || 'Purchase failed')
      }
    } catch (error) {
      toast.error('Purchase failed')
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLiked(!isLiked)
    toast.success(isLiked ? 'Unliked' : 'Liked! ❤️')
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await navigator.share({
        title: name,
        text: `Check out this ${tier} NFT!`,
        url: window.location.href
      })
    } catch (error) {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const getTierBadgeClass = () => {
    const classes: Record<string, string> = {
      Genesis: 'nft-tier-genesis',
      Legendary: 'nft-tier-legendary',
      Rare: 'nft-tier-rare',
      Collector: 'nft-tier-collector'
    }
    return classes[tier] || 'nft-tier-collector'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`nft-card ${isOwned ? 'owned' : ''} ${isStaked ? 'staked' : ''}`}
    >
      <Link href={`/dashboard/nft/${nft.token_id || nft.id}`}>
        <div className="nft-card-image">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name} 
              className="nft-card-img"
              loading="lazy"
            />
          ) : (
            <div className="nft-card-placeholder">
              {TIER_ICONS[tier as keyof typeof TIER_ICONS] || '🏅'}
            </div>
          )}
          
          {/* Tier Badge */}
          <div className={`nft-tier-badge ${getTierBadgeClass()}`}>
            {TIER_ICONS[tier as keyof typeof TIER_ICONS] || '🏅'} {tier}
          </div>

          {/* Status Badges */}
          {isStaked && (
            <div className="nft-staked-badge">
              <FaFire /> Staked
            </div>
          )}
          {isOwned && !isStaked && !isBadge && (
            <div className="nft-owned-badge">
              <FaGem /> Owned
            </div>
          )}

          {/* Supply Badge */}
          {isBadge && nft.max_supply && (
            <div className="nft-supply-badge">
              {nft.current_supply || 0}/{nft.max_supply}
            </div>
          )}

          {/* Hover Overlay */}
          <div className={`nft-card-overlay ${isHovered ? 'visible' : ''}`}>
            <button className="nft-view-btn">
              View Details <FaArrowRight />
            </button>
          </div>
        </div>
      </Link>

      <div className="nft-card-info">
        <div className="nft-card-header">
          <div className="nft-card-title">
            <h3 className="nft-card-name">{name}</h3>
            <p className="nft-card-type">{tier}</p>
          </div>
          <div className="nft-card-price">
            <FaCoins className="text-accent-400" />
            {price.toLocaleString()}
          </div>
        </div>

        <p className="nft-card-description">{description}</p>

        <div className="nft-card-meta">
          <span className="nft-card-meta-item">
            <FaClock /> {dailyReward} SPY/day
          </span>
          {isStaked && (
            <span className="nft-card-meta-item">
              <FaFire className="text-orange-400" /> {STAKING_APY[tier as keyof typeof STAKING_APY] || 0}% APY
            </span>
          )}
        </div>

        <div className="nft-card-footer">
          {!isOwned && !isBadge && (
            <button 
              onClick={handlePurchase} 
              disabled={isPurchasing} 
              className="nft-buy-btn"
            >
              {isPurchasing ? 'Minting...' : 'Mint Now'}
            </button>
          )}
          {isOwned && !isBadge && (
            <Link href={`/dashboard/nft/${nft.token_id}`} className="nft-view-btn-small">
              View Details
            </Link>
          )}
          {isBadge && (
            <button 
              onClick={handlePurchase} 
              disabled={isPurchasing} 
              className="nft-buy-btn"
            >
              {isPurchasing ? 'Minting...' : `Mint ${price.toLocaleString()} SPY`}
            </button>
          )}
          <div className="nft-card-actions">
            <button 
              className={`nft-like-btn ${isLiked ? 'liked' : ''}`} 
              onClick={handleLike}
            >
              <FaHeart />
            </button>
            <button className="nft-share-btn" onClick={handleShare}>
              <FaShare />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
