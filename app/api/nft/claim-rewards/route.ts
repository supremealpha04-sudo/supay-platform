import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tokenId } = await request.json()

  const { data: nft } = await supabase
    .from('user_nfts')
    .select('*, nft_badges(*)')
    .eq('token_id', tokenId)
    .eq('user_id', user.id)
    .single()

  if (!nft || !nft.is_staked) {
    return NextResponse.json({ error: 'NFT not staked' }, { status: 400 })
  }

  const timeStaked = (new Date().getTime() - new Date(nft.last_claim).getTime()) / 1000
  const dailyReward = nft.nft_badges?.staking_reward_daily || 0
  const platformTaxRate = 20
  const totalReward = Math.floor((dailyReward * timeStaked) / 86400)
  const userReward = Math.floor(totalReward * (100 - platformTaxRate) / 100)
  const platformTax = totalReward - userReward

  if (userReward > 0) {
    await supabase
      .from('profiles')
      .update({ spy_balance: supabase.rpc('increment', { x: userReward }) })
      .eq('id', user.id)

    await supabase
      .from('user_nfts')
      .update({
        last_claim: new Date().toISOString(),
        total_rewards_claimed: supabase.rpc('increment', { x: userReward })
      })
      .eq('token_id', tokenId)
  }

  return NextResponse.json({ reward: userReward, tax: platformTax })
}