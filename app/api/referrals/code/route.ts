// app/api/referrals/code/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single()

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${profile?.referral_code}`

  return NextResponse.json({ code: profile?.referral_code, link: referralLink })
}
