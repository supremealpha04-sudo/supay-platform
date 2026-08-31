// app/api/nft/marketplace/buy/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { userId, listingId } = body

    // Get listing with NFT
    const { data: listing, error: listingError } = await supabase
      .from('nft_listings')
      .select('*, user_nfts(*)')
      .eq('id', listingId)
      .eq('status', 'active')
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 })
    }

    // Check if buyer is seller
    if (listing.seller_id === userId) {
      return NextResponse.json({ success: false, error: 'Cannot buy your own NFT' }, { status: 400 })
    }

    // Get buyer balance
    const { data: buyer } = await supabase
      .from('profiles')
      .select('spy_balance')
      .eq('id', userId)
      .single()

    if (!buyer || (buyer.spy_balance || 0) < listing.price_spy) {
      return NextResponse.json({ success: false, error: 'Insufficient SPY' }, { status: 400 })
    }

    // Get seller balance
    const { data: seller } = await supabase
      .from('profiles')
      .select('spy_balance')
      .eq('id', listing.seller_id)
      .single()

    // Calculate fees
    const platformFee = listing.price_spy * 0.025
    const sellerAmount = listing.price_spy - platformFee

    // Update buyer balance
    await supabase
      .from('profiles')
      .update({ spy_balance: (buyer.spy_balance || 0) - listing.price_spy })
      .eq('id', userId)

    // Update seller balance
    if (seller) {
      await supabase
        .from('profiles')
        .update({ spy_balance: (seller.spy_balance || 0) + sellerAmount })
        .eq('id', listing.seller_id)
    }

    // Transfer NFT
    await supabase
      .from('user_nfts')
      .update({ user_id: userId })
      .eq('id', listing.nft_id)

    // Update listing
    await supabase
      .from('nft_listings')
      .update({ status: 'sold' })
      .eq('id', listingId)

    return NextResponse.json({ success: true, message: 'NFT purchased!' })
  } catch (error) {
    console.error('Buy error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
