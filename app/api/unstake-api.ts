// app/api/nft/unstake/route.ts
import { NextResponse } from 'next/server'
import { publicClient, NFT_CONTRACT, encodeUnstake, NFT_ABI } from '@/lib/contracts/server'

export async function POST(req: Request) {
  try {
    const { tokenId } = await req.json()
    if (!tokenId) return NextResponse.json({ error: 'Missing tokenId' }, { status: 400 })

    // Calculate rewards server-side
    const rewards = await publicClient.readContract({
      address: NFT_CONTRACT,
      abi: NFT_ABI,
      functionName: 'calculateRewards',
      args: [BigInt(tokenId)],
    })

    const data = encodeUnstake(BigInt(tokenId))

    return NextResponse.json({
      success: true,
      tx: {
        to: NFT_CONTRACT,
        data,
        value: '0',
        chainId: 56,
      },
      estimatedRewards: rewards.toString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
