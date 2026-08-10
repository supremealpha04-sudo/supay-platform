// app/api/nft/listings/route.ts
import { NextResponse } from 'next/server'
import { publicClient, NFT_CONTRACT, NFT_ABI } from '@/lib/contracts/server'
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search') || ''

    // Get active listings from Supabase
    let query = supabase
      .from('nft_listings')
      .select('*, user_nfts(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('user_nfts.type', filter)
    }

    const { data: dbListings, error } = await query
    if (error) throw error

    // Enrich with on-chain verification and metadata
    const enriched = await Promise.all(
      (dbListings || []).map(async (l: any) => {
        let metadata = null
        let image = ''
        let name = `NFT #${l.token_id}`
        let verified = false

        try {
          // Verify listing is still active on chain
          const onChainListing = await publicClient.readContract({
            address: NFT_CONTRACT,
            abi: NFT_ABI,
            functionName: 'getListing',
            args: [BigInt(l.id)],
          })
          verified = onChainListing.active

          // Fetch metadata
          if (l.user_nfts?.token_uri) {
            const ipfsUrl = l.user_nfts.token_uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
            const res = await fetch(ipfsUrl, { cache: 'no-store' })
            if (res.ok) {
              metadata = await res.json()
              image = metadata.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || ''
              name = metadata.name || name
            }
          }
        } catch {
          // Listing may not exist on chain
        }

        return {
          id: l.id,
          tokenId: l.token_id,
          name,
          image,
          price: l.price,
          seller: l.seller_id,
          type: l.user_nfts?.type || 'regular',
          tier: l.user_nfts?.nft_badges?.tier,
          country: l.user_nfts?.country,
          era: l.user_nfts?.era,
          listingType: l.listing_type || 'fixed',
          verified,
          createdAt: l.created_at,
        }
      })
    )

    // Filter by search query
    const filtered = search
      ? enriched.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
      : enriched

    return NextResponse.json({
      success: true,
      listings: filtered,
    })
  } catch (err: any) {
    console.error('Listings error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
