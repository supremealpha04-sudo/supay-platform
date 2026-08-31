// lib/contracts/server.ts
// Server-side blockchain interactions

import { createPublicClient, createWalletClient, http, parseEther, formatEther, getContract } from 'viem'
import { bsc } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// ==================== ENV VALIDATION ====================

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`
const CONTRACT_ABI = process.env.NEXT_PUBLIC_NFT_ABI

if (!CONTRACT_ADDRESS) {
  console.warn('⚠️ NEXT_PUBLIC_NFT_CONTRACT_ADDRESS not set')
}

if (!CONTRACT_ABI) {
  console.warn('⚠️ NEXT_PUBLIC_NFT_ABI not set')
}

// ==================== PUBLIC CLIENT ====================

export const publicClient = createPublicClient({
  chain: bsc,
  transport: http(process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/'),
})

// ==================== NFT CONTRACT ====================

// Parse ABI from environment
export const NFT_ABI = CONTRACT_ABI ? JSON.parse(CONTRACT_ABI) : []
export const NFT_CONTRACT_ADDRESS = CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'

// ==================== CONTRACT INSTANCES ====================

export const getContract = () => {
  return getContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    client: publicClient,
  })
}

// ==================== WALLET CLIENT ====================

export const createWallet = () => {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`
  if (!privateKey) {
    console.warn('⚠️ No private key found. Write operations disabled.')
    return null
  }
  
  const account = privateKeyToAccount(privateKey)
  
  return createWalletClient({
    account,
    chain: bsc,
    transport: http(process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/'),
  })
}

// ==================== UTILITY FUNCTIONS ====================

export const readContract = async (functionName: string, args: any[] = []) => {
  try {
    const contract = getContract()
    // @ts-ignore - Dynamic function call
    const result = await contract.read[functionName](args)
    return result
  } catch (error) {
    console.error(`Error reading contract: ${functionName}`, error)
    throw error
  }
}

export const writeContract = async (functionName: string, args: any[] = [], value: string = '0') => {
  try {
    const wallet = createWallet()
    if (!wallet) {
      throw new Error('No wallet available')
    }
    
    const contract = getContract()
    // @ts-ignore - Dynamic function call
    const { request } = await contract.simulate[functionName](args, {
      value: parseEther(value),
    })
    
    const hash = await wallet.writeContract(request)
    return hash
  } catch (error) {
    console.error(`Error writing contract: ${functionName}`, error)
    throw error
  }
}

export const parseEtherValue = (value: string) => parseEther(value)
export const formatEtherValue = (value: bigint) => formatEther(value)

// ==================== NFT FUNCTIONS ====================

export const mintNFT = async (to: string, nftType: number, tier: number, country: string, era: number, name: string, description: string, imageURI: string, price: string) => {
  const hash = await writeContract('mintNFT', [nftType, tier, country, era, name, description, imageURI], price)
  return hash
}

export const stakeNFT = async (tokenId: number) => {
  const hash = await writeContract('stakeNFT', [tokenId])
  return hash
}

export const unstakeNFT = async (tokenId: number) => {
  const hash = await writeContract('unstakeNFT', [tokenId])
  return hash
}

export const getNFTData = async (tokenId: number) => {
  const result = await readContract('getNFT', [tokenId])
  return result
}

export const getUserNFTs = async (address: string) => {
  const result = await readContract('getUserNFTs', [address])
  return result
}

export const verifyNFT = async (tokenId: number) => {
  const result = await readContract('verifyNFT', [tokenId])
  return result
}

export const calculateRewards = async (tokenId: number) => {
  const result = await readContract('calculateRewards', [tokenId])
  return result
}
