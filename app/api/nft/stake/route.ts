// app/api/nft/stake/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { userId, nftId } = body

    // Get NFT
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
      return NextResponse.json({ success: false, error: 'Already staked' }, { status: 400 })
    }

    // Update NFT
    const { error: updateError } = await supabase
      .from('user_nfts')
      .update({
        is_staked: true,
        staked_since: new Date().toISOString()
      })
      .eq('id', nftId)

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Failed to stake NFT' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Stake error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
