// app/api/nft/mint/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { userId, badgeId } = body

    // Get user
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, spy_balance')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Get badge
    const { data: badge, error: badgeError } = await supabase
      .from('nft_badges')
      .select('*')
      .eq('id', badgeId)
      .single()

    if (badgeError || !badge) {
      return NextResponse.json({ success: false, error: 'Badge not found' }, { status: 404 })
    }

    // Check supply
    if (badge.current_supply >= badge.max_supply) {
      return NextResponse.json({ success: false, error: 'Sold out' }, { status: 400 })
    }

    // Check balance
    if (user.spy_balance < badge.price_spy) {
      return NextResponse.json({ success: false, error: 'Insufficient SPY' }, { status: 400 })
    }

    // Generate token ID
    const tokenId = `SPY-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    // Deduct SPY
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ spy_balance: user.spy_balance - badge.price_spy })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Failed to update balance' }, { status: 500 })
    }

    // Create NFT
    const { data: nft, error: nftError } = await supabase
      .from('user_nfts')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        token_id: tokenId,
        is_staked: false
      })
      .select()
      .single()

    if (nftError) {
      return NextResponse.json({ success: false, error: nftError.message }, { status: 500 })
    }

    // Update supply
    await supabase
      .from('nft_badges')
      .update({ current_supply: badge.current_supply + 1 })
      .eq('id', badgeId)

    return NextResponse.json({ success: true, nft, tokenId })
  } catch (error) {
    console.error('Mint error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
