// app/api/nft/marketplace/cancel/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { listingId } = body

    // Get listing
    const { data: listing, error: listingError } = await supabase
      .from('nft_listings')
      .select('*')
      .eq('id', listingId)
      .eq('status', 'active')
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 })
    }

    // Update listing
    await supabase
      .from('nft_listings')
      .update({ status: 'cancelled' })
      .eq('id', listingId)

    return NextResponse.json({ success: true, message: 'Listing cancelled' })
  } catch (error) {
    console.error('Cancel error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
