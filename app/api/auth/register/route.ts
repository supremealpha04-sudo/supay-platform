import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function genReferralCode(len = 8) {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return out
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { email, password, username, referralCode } = body

  if (!email || !password || !username) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json(
      { error: 'Username must be 3–20 chars (letters, numbers, underscore)' },
      { status: 400 }
    )
  }

  let referredById: string | null = null
  if (referralCode) {
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .maybeSingle()
    if (referrer) referredById = referrer.id
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        referred_by: referredById,
        referral_code: genReferralCode(),
      },
    },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  if (!authData.user) {
    return NextResponse.json(
      { success: true, message: 'Check your email to confirm your account before signing in.' },
      { status: 200 }
    )
  }

  return NextResponse.json({
    success: true,
    user: { id: authData.user.id, email: authData.user.email },
    needsEmailConfirmation: !authData.session,
  })
}
