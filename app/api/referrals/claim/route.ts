// app/api/referrals/claim/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { referralCode } = await request.json()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: referrer } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', referralCode)
    .single()

  if (!referrer) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
  }

  await supabase
    .from('profiles')
    .update({ referred_by: referrer.id })
    .eq('id', user.id)

  // Award bonus to referrer
  await supabase.rpc('handle_referral_bonus', {
    referrer_id: referrer.id,
    new_user_id: user.id
  })

  // Award bonus to new user
  await supabase
    .from('profiles')
    .update({ spy_balance: supabase.rpc('increment', { x: 10 }) })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
