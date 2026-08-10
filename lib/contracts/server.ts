// lib/contracts/server.ts
// SERVER-SIDE ONLY — Full ABI and Viem client
// This file is NEVER imported in client components

import { createPublicClient, createWalletClient, http, parseEther, formatEther, encodeFunctionData } from 'viem'
import { bsc } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Use a private RPC in production (QuickNode, Infura, Alchemy BSC)
const RPC_URL = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/'

export const publicClient = createPublicClient({
  chain: bsc,
  transport: http(RPC_URL),
})

// Admin wallet for server-side operations (optional, for automated tasks)
const ADMIN_KEY = process.env.ADMIN_PRIVATE_KEY
export const adminClient = ADMIN_KEY
  ? createWalletClient({
      chain: bsc,
      transport: http(RPC_URL),
      account: privateKeyToAccount(ADMIN_KEY as `0x${string}`),
    })
  : null

// Contract addresses from env (server-side only, not NEXT_PUBLIC)
export const NFT_CONTRACT = process.env.NFT_CONTRACT_ADDRESS as `0x${string}`
export const SPY_CONTRACT = process.env.SPY_CONTRACT_ADDRESS as `0x${string}`

// ─── FULL ABI — Server Side Only ───

export const NFT_ABI = [
  // Minting
  {
    name: "mintRegular", type: "function", stateMutability: "payable",
    inputs: [{ name: "_tier", type: "uint8" }, { name: "_tokenURI", type: "string" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "mintGlobal", type: "function", stateMutability: "payable",
    inputs: [{ name: "_tier", type: "uint8" }, { name: "_category", type: "uint8" }, { name: "_tokenURI", type: "string" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "mintCountryLegacy", type: "function", stateMutability: "payable",
    inputs: [{ name: "_country", type: "string" }, { name: "_era", type: "uint8" }, { name: "_tokenURI", type: "string" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "mintSponsor", type: "function", stateMutability: "payable",
    inputs: [{ name: "_sponsorTier", type: "uint256" }, { name: "_tokenURI", type: "string" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "mintCustom", type: "function", stateMutability: "payable",
    inputs: [{ name: "_tokenURI", type: "string" }],
    outputs: [{ type: "uint256" }],
  },
  // Staking
  { name: "stakeNFT", type: "function", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [] },
  { name: "unstakeNFT", type: "function", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [] },
  { name: "claimRewards", type: "function", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [] },
  { name: "calculateRewards", type: "function", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "uint256" }] },
  // Marketplace
  {
    name: "createListing", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }, { name: "price", type: "uint256" }, { name: "listingType", type: "uint8" }, { name: "duration", type: "uint256" }],
    outputs: [],
  },
  { name: "buyNFT", type: "function", stateMutability: "payable", inputs: [{ name: "listingId", type: "uint256" }], outputs: [] },
  { name: "placeBid", type: "function", stateMutability: "payable", inputs: [{ name: "listingId", type: "uint256" }], outputs: [] },
  { name: "endAuction", type: "function", stateMutability: "nonpayable", inputs: [{ name: "listingId", type: "uint256" }], outputs: [] },
  { name: "cancelListing", type: "function", stateMutability: "nonpayable", inputs: [{ name: "listingId", type: "uint256" }], outputs: [] },
  // Verification
  { name: "verifyAuthenticity", type: "function", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "verifyWithSecret", type: "function", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }, { name: "providedSecret", type: "bytes32" }], outputs: [{ type: "bool" }] },
  // Views
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "ownerOf", type: "function", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }] },
  { name: "tokenURI", type: "function", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "string" }] },
  {
    name: "getNFT", type: "function", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ components: [
      { name: "nftType", type: "uint8" }, { name: "tier", type: "uint8" },
      { name: "category", type: "uint8" }, { name: "era", type: "uint8" },
      { name: "country", type: "string" }, { name: "price", type: "uint256" },
      { name: "mintTime", type: "uint256" }, { name: "exists", type: "bool" },
    ], type: "tuple" }],
  },
  {
    name: "getStakeInfo", type: "function", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ components: [
      { name: "isStaked", type: "bool" }, { name: "stakedAt", type: "uint256" },
      { name: "lastClaim", type: "uint256" }, { name: "accumulatedRewards", type: "uint256" },
    ], type: "tuple" }],
  },
  {
    name: "getListing", type: "function", stateMutability: "view", inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [{ components: [
      { name: "tokenId", type: "uint256" }, { name: "seller", type: "address" },
      { name: "price", type: "uint256" }, { name: "listingType", type: "uint8" },
      { name: "startTime", type: "uint256" }, { name: "duration", type: "uint256" },
      { name: "active", type: "bool" }, { name: "highestBidder", type: "address" },
      { name: "highestBid", type: "uint256" },
    ], type: "tuple" }],
  },
  { name: "totalMinted", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "regularMinted", type: "function", stateMutability: "view", inputs: [{ name: "", type: "uint8" }], outputs: [{ type: "uint256" }] },
  { name: "getRegularRemaining", type: "function", stateMutability: "view", inputs: [{ name: "_tier", type: "uint8" }], outputs: [{ type: "uint256" }] },
  { name: "legacyMinted", type: "function", stateMutability: "view", inputs: [{ name: "", type: "string" }, { name: "", type: "uint8" }], outputs: [{ type: "uint256" }] },
  { name: "sponsorMinted", type: "function", stateMutability: "view", inputs: [{ name: "", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { name: "customMinted", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  // Price constants
  { name: "BRONZE_PRICE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "SILVER_PRICE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "GOLD_PRICE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "PLATINUM_PRICE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "DIAMOND_PRICE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "LEGACY_BRONZE_PRICE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "LEGACY_SILVER_PRICE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "LEGACY_GOLD_PRICE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "SPONSOR_EDITION1_PRICE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "SPONSOR_VIP_PRICE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "SPONSOR_ELITE_PRICE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "CUSTOM_BASE_PRICE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const

export const SPY_ABI = [
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "transfer", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "name", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "mint", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { name: "burn", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "addMinter", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_minter", type: "address" }], outputs: [] },
  { name: "totalMinted", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "MAX_SUPPLY", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "remainingSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const

// ─── Helper: Encode transaction data for client signing ───

export function encodeMintRegular(tier: number, tokenURI: string) {
  return encodeFunctionData({ abi: NFT_ABI, functionName: 'mintRegular', args: [tier, tokenURI] })
}

export function encodeMintLegacy(country: string, era: number, tokenURI: string) {
  return encodeFunctionData({ abi: NFT_ABI, functionName: 'mintCountryLegacy', args: [country, era, tokenURI] })
}

export function encodeStake(tokenId: bigint) {
  return encodeFunctionData({ abi: NFT_ABI, functionName: 'stakeNFT', args: [tokenId] })
}

export function encodeUnstake(tokenId: bigint) {
  return encodeFunctionData({ abi: NFT_ABI, functionName: 'unstakeNFT', args: [tokenId] })
}

export function encodeClaim(tokenId: bigint) {
  return encodeFunctionData({ abi: NFT_ABI, functionName: 'claimRewards', args: [tokenId] })
}

export function encodeBuy(listingId: bigint) {
  return encodeFunctionData({ abi: NFT_ABI, functionName: 'buyNFT', args: [listingId] })
}

export function encodeCreateListing(tokenId: bigint, price: bigint, listingType: number, duration: bigint) {
  return encodeFunctionData({ abi: NFT_ABI, functionName: 'createListing', args: [tokenId, price, listingType, duration] })
}
