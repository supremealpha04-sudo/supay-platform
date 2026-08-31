// app/api/nft/rewards/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_nfts')
      .select('total_rewards_earned')
      .eq('user_id', userId)
      .eq('is_staked', true)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const total = data?.reduce((sum: number, nft: any) => sum + (nft.total_rewards_earned || 0), 0) || 0

    return NextResponse.json({ success: true, rewards: total })
  } catch (error) {
    console.error('Rewards error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
