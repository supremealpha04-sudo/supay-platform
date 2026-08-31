// app/api/nft/marketplace/list/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { userId, nftId, price } = body

    // Check NFT ownership
    const { data: nft, error: nftError } = await supabase
      .from('user_nfts')
      .select('*')
      .eq('id', nftId)
      .eq('user_id', userId)
      .single()

    if (nftError || !nft) {
      return NextResponse.json({ success: false, error: 'NFT not found' }, { status: 404 })
    }

    if (nft.is_staked) {
      return NextResponse.json({ success: false, error: 'Cannot list staked NFT' }, { status: 400 })
    }

    // Check if already listed
    const { data: existing } = await supabase
      .from('nft_listings')
      .select('id')
      .eq('nft_id', nftId)
      .eq('status', 'active')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: false, error: 'Already listed' }, { status: 400 })
    }

    // Create listing
    const { data: listing, error: listingError } = await supabase
      .from('nft_listings')
      .insert({
        nft_id: nftId,
        seller_id: userId,
        price_spy: price,
        status: 'active'
      })
      .select()
      .single()

    if (listingError) {
      return NextResponse.json({ success: false, error: listingError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, listing })
  } catch (error) {
    console.error('List error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
