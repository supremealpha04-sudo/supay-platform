// app/dashboard/nft/staking/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NFTService } from '@/lib/services/nft-service'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  FaCoins, FaFire, FaClock, FaArrowUp, FaArrowDown,
  FaGem, FaRocket, FaShieldAlt, FaCheck, FaTimes
} from 'react-icons/fa'
import { TIER_COLORS, TIER_ICONS, STAKING_APY } from '@/types/nft'
import '../styles/staking.css'

export default function StakingPage() {
  const { user } = useAuth()
  const [stakedNFTs, setStakedNFTs] = useState<any[]>([])
  const [availableNFTs, setAvailableNFTs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalRewards, setTotalRewards] = useState(0)
  const [selectedNFT, setSelectedNFT] = useState<any>(null)
  const [showStakeModal, setShowStakeModal] = useState(false)

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  async function fetchData() {
    try {
      const allNFTs = await NFTService.getUserNFTs(user!.id)
      const staked = allNFTs.filter(n => n.is_staked)
      const available = allNFTs.filter(n => !n.is_staked)
      
      setStakedNFTs(staked)
      setAvailableNFTs(available)
      setTotalRewards(await NFTService.getStakingRewards(user!.id))
    } catch (error) {
      console.error('Error fetching staking data:', error)
      toast.error('Failed to load staking data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStake = async (nftId: string) => {
    const loading = toast.loading('Staking NFT...')
    try {
      const result = await NFTService.stakeNFT(user!.id, nftId)
      if (result.success) {
        toast.success('NFT staked successfully! 🚀', { id: loading })
        fetchData()
        setShowStakeModal(false)
      } else {
        toast.error(result.error || 'Failed to stake', { id: loading })
      }
    } catch (error) {
      toast.error('Failed to stake', { id: loading })
    }
  }

  const handleUnstake = async (nftId: string) => {
    const loading = toast.loading('Unstaking NFT...')
    try {
      const result = await NFTService.unstakeNFT(user!.id, nftId)
      if (result.success) {
        toast.success(`Unstaked! Earned ${result.rewards?.toFixed(2) || 0} SPY`, { id: loading })
        fetchData()
      } else {
        toast.error(result.error || 'Failed to unstake', { id: loading })
      }
    } catch (error) {
      toast.error('Failed to unstake', { id: loading })
    }
  }

  if (isLoading) {
    return (
      <div className="nft-loading">
        <div className="nft-loading-spinner" />
        <p>Loading staking data...</p>
      </div>
    )
  }

  return (
    <div className="nft-staking">
      {/* Header */}
      <div className="nft-staking-header">
        <h1><FaFire className="text-orange-400" /> NFT Staking</h1>
        <p>Stake your NFTs to earn passive rewards</p>
      </div>

      {/* Stats */}
      <div className="nft-staking-stats">
        <div className="nft-staking-stat">
          <FaGem className="text-accent-500" />
          <div>
            <span className="nft-staking-stat-label">Staked NFTs</span>
            <span className="nft-staking-stat-value">{stakedNFTs.length}</span>
          </div>
        </div>
        <div className="nft-staking-stat">
          <FaCoins className="text-green-400" />
          <div>
            <span className="nft-staking-stat-label">Total Rewards</span>
            <span className="nft-staking-stat-value">{totalRewards.toFixed(2)} SPY</span>
          </div>
        </div>
        <div className="nft-staking-stat">
          <FaFire className="text-orange-400" />
          <div>
            <span className="nft-staking-stat-label">Available</span>
            <span className="nft-staking-stat-value">{availableNFTs.length}</span>
          </div>
        </div>
      </div>

      {/* Staking Rates */}
      <div className="nft-staking-rates">
        <h3>Staking Rates</h3>
        <div className="nft-staking-rate-grid">
          {Object.entries(STAKING_APY).map(([tier, apy]) => (
            <div key={tier} className="nft-staking-rate-card">
              <span className="nft-staking-rate-tier">{TIER_ICONS[tier as keyof typeof TIER_ICONS]} {tier}</span>
              <span className="nft-staking-rate-value">{apy}% APY</span>
            </div>
          ))}
        </div>
      </div>

      {/* Staked NFTs */}
      <div className="nft-staking-section">
        <h2>Staked NFTs ({stakedNFTs.length})</h2>
        {stakedNFTs.length > 0 ? (
          <div className="nft-staking-grid">
            {stakedNFTs.map((nft) => (
              <div key={nft.id} className="nft-staking-card staked">
                <div className="nft-staking-card-header">
                  <span className="nft-staking-tier">{nft.badge?.tier}</span>
                  <span className="nft-staking-rate">{STAKING_APY[nft.badge?.tier] || 0}% APY</span>
                </div>
                <div className="nft-staking-card-image">
                  {nft.badge?.image_url ? (
                    <Image 
                      src={nft.badge.image_url} 
                      alt={nft.badge?.name} 
                      width={80} 
                      height={80} 
                      className="nft-staking-img"
                    />
                  ) : (
                    <div className="nft-staking-placeholder">
                      {TIER_ICONS[nft.badge?.tier as keyof typeof TIER_ICONS]}
                    </div>
                  )}
                </div>
                <h4>{nft.badge?.name}</h4>
                <p className="nft-staking-rewards">
                  Earned: <strong>{nft.total_rewards_earned?.toFixed(2) || 0} SPY</strong>
                </p>
                <div className="nft-staking-card-footer">
                  <span className="nft-staking-since">
                    <FaClock /> {new Date(nft.staked_since).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => handleUnstake(nft.id)} 
                    className="nft-staking-unstake"
                  >
                    Unstake
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="nft-empty-state">
            <FaFire className="nft-empty-icon" />
            <h3>No Staked NFTs</h3>
            <p>Stake your NFTs to start earning rewards</p>
          </div>
        )}
      </div>

      {/* Available NFTs */}
      <div className="nft-staking-section">
        <h2>Available to Stake ({availableNFTs.length})</h2>
        {availableNFTs.length > 0 ? (
          <div className="nft-staking-grid">
            {availableNFTs.map((nft) => (
              <div key={nft.id} className="nft-staking-card available">
                <div className="nft-staking-card-header">
                  <span className="nft-staking-tier">{nft.badge?.tier}</span>
                  <span className="nft-staking-rate">{STAKING_APY[nft.badge?.tier] || 0}% APY</span>
                </div>
                <div className="nft-staking-card-image">
                  {nft.badge?.image_url ? (
                    <Image 
                      src={nft.badge.image_url} 
                      alt={nft.badge?.name} 
                      width={80} 
                      height={80} 
                      className="nft-staking-img"
                    />
                  ) : (
                    <div className="nft-staking-placeholder">
                      {TIER_ICONS[nft.badge?.tier as keyof typeof TIER_ICONS]}
                    </div>
                  )}
                </div>
                <h4>{nft.badge?.name}</h4>
                <p className="nft-staking-rewards">
                  APY: <strong>{STAKING_APY[nft.badge?.tier] || 0}%</strong>
                </p>
                <div className="nft-staking-card-footer">
                  <button 
                    onClick={() => {
                      setSelectedNFT(nft)
                      setShowStakeModal(true)
                    }} 
                    className="nft-staking-stake"
                  >
                    Stake
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="nft-empty-state">
            <FaGem className="nft-empty-icon" />
            <h3>No NFTs Available</h3>
            <p>Mint or buy NFTs to stake</p>
            <Link href="/dashboard/nft/mint">
              <button className="nft-btn-primary">Mint NFT</button>
            </Link>
          </div>
        )}
      </div>

      {/* Stake Modal */}
      {showStakeModal && selectedNFT && (
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
                  <span>{selectedNFT.badge?.name}</span>
                </div>
                <div className="nft-stake-summary-item">
                  <span>Tier</span>
                  <span>{selectedNFT.badge?.tier}</span>
                </div>
                <div className="nft-stake-summary-item">
                  <span>APY</span>
                  <span className="text-green-400">{STAKING_APY[selectedNFT.badge?.tier] || 0}%</span>
                </div>
                <div className="nft-stake-summary-item">
                  <span>Daily Reward</span>
                  <span>{selectedNFT.badge?.daily_reward_spy || 0} SPY</span>
                </div>
              </div>
              <div className="nft-modal-actions">
                <button onClick={() => setShowStakeModal(false)} className="nft-btn-cancel">
                  Cancel
                </button>
                <button 
                  onClick={() => handleStake(selectedNFT.id)} 
                  className="nft-btn-confirm"
                >
                  Confirm Stake
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
