// app/dashboard/nft/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FaGem, FaCoins, FaClock, FaChartLine, FaShoppingCart, FaExchangeAlt, FaLock, FaArrowUp, FaShieldAlt } from 'react-icons/fa'
import styles from './page.module.css'

const supabase = createClient()

type NFTTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'

const nftTiers = {
  Bronze: {
    tier: 'Bronze',
    premiumMonthsRequired: 3,
    purchasePriceSPY: 500,
    stakingRewardDaily: 5,
    maxSupply: 10000,
    benefits: {
      earningMultiplier: 1.1,
      withdrawalFeeDiscount: 50,
      exclusiveTasksPerWeek: 5
    }
  },
  Silver: {
    tier: 'Silver',
    premiumMonthsRequired: 6,
    purchasePriceSPY: 2000,
    stakingRewardDaily: 15,
    maxSupply: 5000,
    benefits: {
      earningMultiplier: 1.25,
      withdrawalFeeDiscount: 75,
      exclusiveTasksPerWeek: 10,
      stakingBoost: 5
    }
  },
  Gold: {
    tier: 'Gold',
    premiumMonthsRequired: 12,
    purchasePriceSPY: 10000,
    stakingRewardDaily: 50,
    maxSupply: 1000,
    benefits: {
      earningMultiplier: 1.5,
      withdrawalFeeDiscount: 90,
      exclusiveTasksPerWeek: 20,
      stakingBoost: 10,
      governanceVoting: true
    }
  },
  Platinum: {
    tier: 'Platinum',
    premiumMonthsRequired: 24,
    purchasePriceSPY: 50000,
    stakingRewardDaily: 200,
    maxSupply: 100,
    benefits: {
      earningMultiplier: 2,
      withdrawalFeeDiscount: 100,
      exclusiveTasksPerWeek: 999,
      stakingBoost: 25,
      revenueShare: 0.5
    }
  },
  Diamond: {
    tier: 'Diamond',
    premiumMonthsRequired: 36,
    purchasePriceSPY: 250000,
    stakingRewardDaily: 1000,
    maxSupply: 10,
    benefits: {
      earningMultiplier: 3,
      withdrawalFeeDiscount: 100,
      exclusiveTasksPerWeek: 999,
      stakingBoost: 50,
      revenueShare: 2,
      customNFT: true,
      lifetimePremium: true
    }
  }
}

export default function NFTPage() {
  const { profile, refreshProfile } = useAuth()
  const [userNFTs, setUserNFTs] = useState<any[]>([])
  const [stakedNFTs, setStakedNFTs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      fetchUserNFTs()
      fetchStakedNFTs()
    }
  }, [profile])

  async function fetchUserNFTs() {
    const { data } = await supabase
      .from('user_nfts')
      .select('*, nft_badges(*)')
      .eq('user_id', profile?.id)
    
    setUserNFTs(data || [])
    setIsLoading(false)
  }

  async function fetchStakedNFTs() {
    const { data } = await supabase
      .from('user_nfts')
      .select('*, nft_badges(*)')
      .eq('user_id', profile?.id)
      .eq('is_staked', true)
    
    setStakedNFTs(data || [])
  }

  async function purchaseNFT(tier: string) {
    const tierData = nftTiers[tier as NFTTier]
    
    if (!tierData) return
    
    if ((profile?.spy_balance || 0) < tierData.purchasePriceSPY) {
      toast.error(`Insufficient SPY. Need ${tierData.purchasePriceSPY} SPY`)
      return
    }

    if (!profile?.is_premium) {
      toast.error('Premium subscription required to purchase NFTs')
      return
    }

    toast.loading('Processing purchase...', { id: 'purchase' })

    try {
      const response = await fetch('/api/nft/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          userId: profile?.id
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Successfully purchased ${tier} NFT!`, { id: 'purchase' })
        await refreshProfile()
        await fetchUserNFTs()
        setSelectedTier(null)
      } else {
        toast.error(data.error, { id: 'purchase' })
      }
    } catch (error) {
      toast.error('Purchase failed', { id: 'purchase' })
    }
  }

  async function stakeNFT(tokenId: number) {
    toast.loading('Staking NFT...', { id: 'stake' })

    try {
      const response = await fetch('/api/nft/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, userId: profile?.id })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('NFT staked! You will earn daily rewards.', { id: 'stake' })
        await fetchUserNFTs()
        await fetchStakedNFTs()
      } else {
        toast.error(data.error, { id: 'stake' })
      }
    } catch (error) {
      toast.error('Failed to stake', { id: 'stake' })
    }
  }

  const getMultiplierText = (tier: string | undefined) => {
    if (!tier) return '1x earnings'
    switch (tier) {
      case 'Bronze': return `${nftTiers.Bronze.benefits.earningMultiplier}x earnings`
      case 'Silver': return `${nftTiers.Silver.benefits.earningMultiplier}x earnings`
      case 'Gold': return `${nftTiers.Gold.benefits.earningMultiplier}x earnings`
      case 'Platinum': return `${nftTiers.Platinum.benefits.earningMultiplier}x earnings`
      case 'Diamond': return `${nftTiers.Diamond.benefits.earningMultiplier}x earnings`
      default: return '1x earnings'
    }
  }

  if (isLoading) {
    return (
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.nftPage}>
      <div className={styles.heroCard}>
        <h1 className={styles.heroTitle}>NFT Badges</h1>
        <p className={styles.heroDescription}>Purchase NFT badges to boost your earnings and earn passive SPY</p>
      </div>

      {/* User's NFTs */}
      {userNFTs.length > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.heroHeader}>
            <FaGem className={styles.statIcon} />
            <h2 className={styles.sectionTitle}>Your NFTs</h2>
          </div>
          <div className={styles.cardsGrid}>
            {userNFTs.map((nft) => (
              <div key={nft.id} className={styles.nftCard}>
                <div className={styles.nftCardHeader}>
                  <h3 className={styles.sectionTitle}>{nft.nft_badges?.tier}</h3>
                  {nft.is_staked ? (
                    <span className={styles.nftBadge}>
                      <FaLock className="w-3 h-3" /> Staked
                    </span>
                  ) : (
                    <button
                      onClick={() => stakeNFT(nft.token_id)}
                      className={styles.stakeButton}
                    >
                      Stake
                    </button>
                  )}
                </div>
                <div className={styles.nftCardText}>
                  <div className={styles.nftCardRow}>
                    <span>Daily Reward</span>
                    <span>{nft.nft_badges?.staking_reward_daily} SPY/day</span>
                  </div>
                  <div className={styles.nftCardRow}>
                    <span>Earnings Multiplier</span>
                    <span>{getMultiplierText(nft.nft_badges?.tier)}</span>
                  </div>
                  {nft.is_staked && (
                    <div className={styles.nftCardRow}>
                      <span>Staked Since</span>
                      <span>{new Date(nft.staked_since).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available NFTs for Purchase */}
      <div className={styles.sectionCard}>
        <div className={styles.heroHeader}>
          <FaShoppingCart className={styles.statIcon} />
          <h2 className={styles.sectionTitle}>Available NFTs</h2>
        </div>
        <div className={styles.cardsGrid}>
          {Object.entries(nftTiers).map(([tier, data]) => {
            const alreadyOwned = userNFTs.some(n => n.nft_badges?.tier === tier)
            return (
              <div key={tier} className={`${styles.nftCard} ${alreadyOwned ? styles.ownedButton : ''}`}>
                <div className="text-center mb-3">
                  <div className={`${styles.tierBadge} ${
                    tier === 'Diamond' ? styles.tierDiamond :
                    tier === 'Platinum' ? styles.tierPlatinum :
                    tier === 'Gold' ? styles.tierGold :
                    tier === 'Silver' ? styles.tierSilver :
                    styles.tierBronze
                  }`}>
                    {tier[0]}
                  </div>
                  <h3 className={styles.sectionTitle}>{tier}</h3>
                </div>
                <div className={styles.nftCardText}>
                  <div className={styles.nftCardRow}>
                    <span>Price</span>
                    <span className={styles.rewardValue}>{data.purchasePriceSPY.toLocaleString()} SPY</span>
                  </div>
                  <div className={styles.nftCardRow}>
                    <span>Daily Reward</span>
                    <span className={styles.rewardValue}>{data.stakingRewardDaily} SPY</span>
                  </div>
                  <div className={styles.nftCardRow}>
                    <span>Multiplier</span>
                    <span>{data.benefits.earningMultiplier}x</span>
                  </div>
                  <div className={styles.nftCardRow}>
                    <span>Premium Required</span>
                    <span>{data.premiumMonthsRequired} months</span>
                  </div>
                </div>
                <button
                  onClick={() => !alreadyOwned && purchaseNFT(tier)}
                  disabled={alreadyOwned}
                  className={alreadyOwned ? styles.ownedButton : styles.purchaseButton}
                >
                  {alreadyOwned ? 'Owned' : 'Purchase'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Staking Rewards Info */}
      {stakedNFTs.length > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.heroHeader}>
            <FaChartLine className={styles.statIcon} />
            <h2 className={styles.sectionTitle}>Staking Rewards</h2>
          </div>
          <div className={styles.rewardCard}>
            <div className={styles.rewardsGrid}>
              <div>
                <p className={styles.rewardLabel}>Daily Rewards</p>
                <p className={styles.rewardValue}>
                  {stakedNFTs.reduce((sum, n) => sum + (n.nft_badges?.staking_reward_daily || 0), 0)} SPY
                </p>
              </div>
              <div>
                <p className={styles.rewardLabel}>Monthly Rewards</p>
                <p className={styles.rewardValue}>
                  {stakedNFTs.reduce((sum, n) => sum + (n.nft_badges?.staking_reward_daily || 0), 0) * 30} SPY
                </p>
              </div>
              <div>
                <p className={styles.rewardLabel}>Yearly Rewards</p>
                <p className={styles.rewardValue}>
                  {stakedNFTs.reduce((sum, n) => sum + (n.nft_badges?.staking_reward_daily || 0), 0) * 365} SPY
                </p>
              </div>
              <div>
                <p className={styles.rewardLabel}>≈ USD Value</p>
                <p className={styles.rewardValue}>
                  ${(stakedNFTs.reduce((sum, n) => sum + (n.nft_badges?.staking_reward_daily || 0), 0) * 365 / 100).toFixed(2)}/year
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}