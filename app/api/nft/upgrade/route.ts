import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tokenId, targetTier } = await request.json()

  const { data: nft } = await supabase
    .from('user_nfts')
    .select('*, nft_badges(*)')
    .eq('token_id', tokenId)
    .eq('user_id', user.id)
    .single()

  if (!nft) {
    return NextResponse.json({ error: 'NFT not found' }, { status: 404 })
  }

  const { data: targetBadge } = await supabase
    .from('nft_badges')
    .select('*')
    .eq('tier', targetTier)
    .single()

  if (!targetBadge) {
    return NextResponse.json({ error: 'Invalid target tier' }, { status: 400 })
  }

  const upgradeCost = targetBadge.purchase_price_spy - nft.nft_badges.purchase_price_spy
  const upgradeFee = Math.floor(upgradeCost * 0.1)
  const totalCost = upgradeCost + upgradeFee

  const { data: profile } = await supabase
    .from('profiles')
    .select('spy_balance')
    .eq('id', user.id)
    .single()

  if ((profile?.spy_balance || 0) < totalCost) {
    return NextResponse.json({ error: 'Insufficient SPY' }, { status: 400 })
  }

  const newBalance = (profile?.spy_balance || 0) - totalCost

  await supabase
    .from('profiles')
    .update({ spy_balance: newBalance })
    .eq('id', user.id)

  await supabase
    .from('user_nfts')
    .delete()
    .eq('token_id', tokenId)

  const newTokenId = Math.floor(Math.random() * 1000000)
  await supabase.from('user_nfts').insert({
    user_id: user.id,
    badge_id: targetBadge.id,
    token_id: newTokenId,
    purchase_price_spy: targetBadge.purchase_price_spy,
    is_staked: false
  })

  return NextResponse.json({
    success: true,
    new_token_id: newTokenId,
    new_tier: targetTier,
    cost: totalCost
  })
}