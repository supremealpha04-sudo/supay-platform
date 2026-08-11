// app/api/nft/verify/route.ts
import { NextResponse } from 'next/server'
import { publicClient, NFT_CONTRACT, NFT_ABI } from '@/lib/contracts/server'

export async function POST(req: Request) {
  try {
    const { tokenId } = await req.json()
    if (!tokenId) return NextResponse.json({ error: 'Missing tokenId' }, { status: 400 })

    const isValid = await publicClient.readContract({
      address: NFT_CONTRACT,
      abi: NFT_ABI,
      functionName: 'verifyAuthenticity',
      args: [BigInt(tokenId)],
    })

    // Also get NFT details
    const nft = await publicClient.readContract({
      address: NFT_CONTRACT,
      abi: NFT_ABI,
      functionName: 'getNFT',
      args: [BigInt(tokenId)],
    })

    return NextResponse.json({
      success: true,
      isValid,
      nft: {
        exists: nft.exists,
        type: nft.nftType,
        tier: nft.tier,
        country: nft.country,
        era: nft.era,
        mintTime: Number(nft.mintTime),
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
