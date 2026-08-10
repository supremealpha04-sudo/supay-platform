// app/api/nft/stake/route.ts
import { NextResponse } from 'next/server'
import { NFT_CONTRACT, encodeStake } from '@/lib/contracts/server'

export async function POST(req: Request) {
  try {
    const { tokenId } = await req.json()
    if (!tokenId) return NextResponse.json({ error: 'Missing tokenId' }, { status: 400 })

    const data = encodeStake(BigInt(tokenId))

    return NextResponse.json({
      success: true,
      tx: {
        to: NFT_CONTRACT,
        data,
        value: '0',
        chainId: 56,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
