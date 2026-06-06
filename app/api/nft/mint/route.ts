// app/api/nft/mint/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { tier } = await request.json()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get tier details
  const { data: badge } = await supabase
    .from('nft_badges')
    .select('*')
    .eq('tier', tier)
    .single()

  if (!badge) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  // Check premium status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, spy_balance, premium_until')
    .eq('id', user.id)
    .single()

  if (!profile?.is_premium) {
    return NextResponse.json({ error: 'Premium subscription required' }, { status: 400 })
  }

  // Check premium duration
  const premiumMonths = profile.premium_until
    ? Math.ceil((new Date(profile.premium_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0

  if (premiumMonths < badge.premium_months_required) {
    return NextResponse.json({ error: `Need ${badge.premium_months_required} months of premium` }, { status: 400 })
  }

  // Check sufficient SPY
  if ((profile?.spy_balance || 0) < badge.purchase_price_spy) {
    return NextResponse.json({ error: 'Insufficient SPY' }, { status: 400 })
  }

  // Check supply
  const { count } = await supabase
    .from('user_nfts')
    .select('id', { count: 'exact', head: true })
    .eq('badge_id', badge.id)

  if ((count || 0) >= badge.max_supply) {
    return NextResponse.json({ error: 'NFT sold out' }, { status: 400 })
  }

  // Deduct SPY
  const newBalance = (profile?.spy_balance || 0) - badge.purchase_price_spy
  await supabase
    .from('profiles')
    .update({ spy_balance: newBalance })
    .eq('id', user.id)

  // Generate token ID
  const tokenId = Math.floor(Math.random() * 1000000)

  // Mint NFT
  await supabase.from('user_nfts').insert({
    user_id: user.id,
    badge_id: badge.id,
    token_id: tokenId,
    purchase_price_spy: badge.purchase_price_spy,
    is_staked: false
  })

  // Record transaction
  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'nft_purchase',
    amount_spy: -badge.purchase_price_spy,
    balance_before: profile?.spy_balance || 0,
    balance_after: newBalance,
    metadata: { tier, token_id: tokenId }
  })

  return NextResponse.json({
    success: true,
    token_id: tokenId,
    tier
  })
}
