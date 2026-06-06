import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const secret = authenticator.generateSecret()
  const otpauth = authenticator.keyuri(user.email!, 'Supay', secret)
  const qrCode = await QRCode.toDataURL(otpauth)

  await supabase
    .from('user_security')
    .upsert({ user_id: user.id, twofa_secret: secret, twofa_enabled: false })

  return NextResponse.json({ secret, qrCode })
}
