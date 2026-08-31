// lib/contracts/client.ts
// Client-side blockchain interactions

import { createPublicClient, createWalletClient, http, formatEther, getContract } from 'viem'
import { bsc } from 'viem/chains'

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
  transport: http(process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org/'),
})

// ==================== NFT CONTRACT ====================

export const NFT_ABI = CONTRACT_ABI ? JSON.parse(CONTRACT_ABI) : []
export const NFT_CONTRACT_ADDRESS = CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'

// ==================== CONTRACT INSTANCES ====================

export const getContract = (walletClient?: any) => {
  return getContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    client: walletClient || publicClient,
  })
}

// ==================== WALLET CLIENT ====================

export const getWalletClient = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Window is undefined')
  }
  
  if (!window.ethereum) {
    throw new Error('No wallet found. Install MetaMask or Trust Wallet.')
  }
  
  const walletClient = createWalletClient({
    chain: bsc,
    transport: http(window.ethereum),
  })
  
  return walletClient
}

// ==================== UTILITY FUNCTIONS ====================

export const connectWallet = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet found. Install MetaMask or Trust Wallet.')
  }
  
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  return accounts[0]
}

export const getBalance = async (address: string) => {
  const balance = await publicClient.getBalance({ address: address as `0x${string}` })
  return formatEther(balance)
}

export const signMessage = async (message: string) => {
  const walletClient = await getWalletClient()
  const [account] = await walletClient.getAddresses()
  const signature = await walletClient.signMessage({
    account,
    message,
  })
  return signature
}

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
