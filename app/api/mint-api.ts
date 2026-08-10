// app/api/nft/mint/route.ts
import { NextResponse } from 'next/server'
import { publicClient, NFT_CONTRACT, encodeMintRegular, encodeMintLegacy, NFT_ABI } from '@/lib/contracts/server'
import { parseEther, formatEther } from 'viem'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, tier, country, era, tokenURI, userAddress } = body

    if (!userAddress || !tokenURI) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    let data: `0x${string}`
    let value: bigint
    let priceLabel: string

    if (type === 'regular') {
      const tierIndex = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].indexOf(tier)
      if (tierIndex === -1) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

      // Read price from contract
      const price = await publicClient.readContract({
        address: NFT_CONTRACT,
        abi: NFT_ABI,
        functionName: ['BRONZE_PRICE', 'SILVER_PRICE', 'GOLD_PRICE', 'PLATINUM_PRICE', 'DIAMOND_PRICE'][tierIndex],
      })

      data = encodeMintRegular(tierIndex, tokenURI)
      value = price as bigint
      priceLabel = `${formatEther(value)} BNB`
    } 
    else if (type === 'legacy') {
      const eraIndex = ['Bronze', 'Silver', 'Gold'].indexOf(era)
      if (eraIndex === -1) return NextResponse.json({ error: 'Invalid era' }, { status: 400 })

      const price = await publicClient.readContract({
        address: NFT_CONTRACT,
        abi: NFT_ABI,
        functionName: ['LEGACY_BRONZE_PRICE', 'LEGACY_SILVER_PRICE', 'LEGACY_GOLD_PRICE'][eraIndex],
      })

      data = encodeMintLegacy(country, eraIndex, tokenURI)
      value = price as bigint
      priceLabel = `${formatEther(value)} BNB`
    }
    else {
      return NextResponse.json({ error: 'Invalid mint type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      tx: {
        to: NFT_CONTRACT,
        data,
        value: value.toString(),
        priceLabel,
        chainId: 56,
      }
    })
  } catch (err: any) {
    console.error('Mint prep error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
