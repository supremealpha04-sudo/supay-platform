// app/api/nft/marketplace/buy/route.ts
import { NextResponse } from 'next/server'
import { publicClient, NFT_CONTRACT, encodeBuy, NFT_ABI } from '@/lib/contracts/server'

export async function POST(req: Request) {
  try {
    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })

    // Get listing details to determine price
    const listing = await publicClient.readContract({
      address: NFT_CONTRACT,
      abi: NFT_ABI,
      functionName: 'getListing',
      args: [BigInt(listingId)],
    })

    const data = encodeBuy(BigInt(listingId))

    return NextResponse.json({
      success: true,
      tx: {
        to: NFT_CONTRACT,
        data,
        value: listing.price.toString(),
        priceLabel: `${listing.price} wei`,
        chainId: 56,
      },
      listing: {
        tokenId: listing.tokenId.toString(),
        seller: listing.seller,
        price: listing.price.toString(),
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
