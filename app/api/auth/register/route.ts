
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { email, password, username, referralCode } = await request.json()

  if (!email || !password || !username) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  let referredById = null
  if (referralCode) {
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .single()
    if (referrer) referredById = referrer.id
  }

  await supabase.from('profiles').insert({
    id: authData.user!.id,
    username,
    referral_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    referred_by: referredById
  })

  if (referredById) {
    await supabase.rpc('handle_referral_bonus', {
      referrer_id: referredById,
      new_user_id: authData.user!.id
    })
  }

  return NextResponse.json({ success: true, user: authData.user })
}
