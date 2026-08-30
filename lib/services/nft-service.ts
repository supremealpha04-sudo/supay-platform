// lib/services/nft-service.ts
import { createClient } from '@/lib/supabase/client'
import { UserNFT, NFTBadge, NFTListing } from '@/types/nft'

const supabase = createClient()

export const NFTService = {
  // Get all available badges
  async getBadges(): Promise<NFTBadge[]> {
    try {
      const { data, error } = await supabase
        .from('nft_badges')
        .select('*')
        .order('price_spy', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching badges:', error)
      return []
    }
  },

  // Get user's NFTs
  async getUserNFTs(userId: string): Promise<UserNFT[]> {
    try {
      const { data, error } = await supabase
        .from('user_nfts')
        .select('*, badge:nft_badges(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user NFTs:', error)
      return []
    }
  },

  // Get staked NFTs
  async getStakedNFTs(userId: string): Promise<UserNFT[]> {
    try {
      const { data, error } = await supabase
        .from('user_nfts')
        .select('*, badge:nft_badges(*)')
        .eq('user_id', userId)
        .eq('is_staked', true)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching staked NFTs:', error)
      return []
    }
  },

  // Get active marketplace listings
  async getListings(): Promise<NFTListing[]> {
    try {
      const { data, error } = await supabase
        .from('nft_listings')
        .select('*, user_nfts(*, badge:nft_badges(*))')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching listings:', error)
      return []
    }
  },

  // Mint NFT
  async mintNFT(userId: string, badgeId: string): Promise<any> {
    try {
      const response = await fetch('/api/nft/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, badgeId })
      })
      return response.json()
    } catch (error) {
      console.error('Error minting NFT:', error)
      return { success: false, error: 'Failed to mint NFT' }
    }
  },

  // Stake NFT
  async stakeNFT(userId: string, nftId: string): Promise<any> {
    try {
      const response = await fetch('/api/nft/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, nftId })
      })
      return response.json()
    } catch (error) {
      console.error('Error staking NFT:', error)
      return { success: false, error: 'Failed to stake NFT' }
    }
  },

  // Unstake NFT
  async unstakeNFT(userId: string, nftId: string): Promise<any> {
    try {
      const response = await fetch('/api/nft/unstake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, nftId })
      })
      return response.json()
    } catch (error) {
      console.error('Error unstaking NFT:', error)
      return { success: false, error: 'Failed to unstake NFT' }
    }
  },

  // List NFT on marketplace
  async listNFT(userId: string, nftId: string, price: number): Promise<any> {
    try {
      const response = await fetch('/api/nft/marketplace/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, nftId, price })
      })
      return response.json()
    } catch (error) {
      console.error('Error listing NFT:', error)
      return { success: false, error: 'Failed to list NFT' }
    }
  },

  // Buy NFT from marketplace
  async buyNFT(userId: string, listingId: string): Promise<any> {
    try {
      const response = await fetch('/api/nft/marketplace/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, listingId })
      })
      return response.json()
    } catch (error) {
      console.error('Error buying NFT:', error)
      return { success: false, error: 'Failed to buy NFT' }
    }
  },

  // Calculate total staking rewards
  async getStakingRewards(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_nfts')
        .select('total_rewards_earned')
        .eq('user_id', userId)
        .eq('is_staked', true)
      
      if (error) return 0
      return data?.reduce((sum: number, nft: any) => sum + (nft.total_rewards_earned || 0), 0) || 0
    } catch (error) {
      console.error('Error getting staking rewards:', error)
      return 0
    }
  },

  // Get NFT by token ID
  async getNFTByTokenId(tokenId: string): Promise<UserNFT | null> {
    try {
      const { data, error } = await supabase
        .from('user_nfts')
        .select('*, badge:nft_badges(*)')
        .eq('token_id', tokenId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching NFT:', error)
      return null
    }
  },

  // Get collection by ID
  async getCollectionById(id: string): Promise<NFTBadge | null> {
    try {
      const { data, error } = await supabase
        .from('nft_badges')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching collection:', error)
      return null
    }
  },

  // Get NFTs by collection
  async getNFTsByCollection(badgeId: string): Promise<UserNFT[]> {
    try {
      const { data, error } = await supabase
        .from('user_nfts')
        .select('*, badge:nft_badges(*)')
        .eq('badge_id', badgeId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching collection NFTs:', error)
      return []
    }
  }
}
