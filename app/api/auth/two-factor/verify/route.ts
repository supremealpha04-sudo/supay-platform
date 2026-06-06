import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { authenticator } from 'otplib'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { token } = await request.json()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: security } = await supabase
    .from('user_security')
    .select('twofa_secret')
    .eq('user_id', user.id)
    .single()

  if (!security) {
    return NextResponse.json({ error: '2FA not set up' }, { status: 400 })
  }

  const isValid = authenticator.verify({ token, secret: security.twofa_secret })

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  await supabase
    .from('user_security')
    .update({ twofa_enabled: true })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
