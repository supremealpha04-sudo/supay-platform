// app/api/nft/rewards/route.ts
import { NextResponse } from 'next/server'
import { publicClient, NFT_CONTRACT, NFT_ABI } from '@/lib/contracts/server'

export async function POST(req: Request) {
  try {
    const { tokenId } = await req.json()
    if (!tokenId) return NextResponse.json({ error: 'Missing tokenId' }, { status: 400 })

    const rewards = await publicClient.readContract({
      address: NFT_CONTRACT,
      abi: NFT_ABI,
      functionName: 'calculateRewards',
      args: [BigInt(tokenId)],
    })

    const stakeInfo = await publicClient.readContract({
      address: NFT_CONTRACT,
      abi: NFT_ABI,
      functionName: 'getStakeInfo',
      args: [BigInt(tokenId)],
    })

    return NextResponse.json({
      success: true,
      rewards: rewards.toString(),
      isStaked: stakeInfo.isStaked,
      stakedAt: stakeInfo.stakedAt ? Number(stakeInfo.stakedAt) : null,
      lastClaim: stakeInfo.lastClaim ? Number(stakeInfo.lastClaim) : null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
