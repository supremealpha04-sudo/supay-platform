// app/api/premium/status/route.ts
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
    .select('is_premium, premium_until')
    .eq('id', user.id)
    .single()

  const { data: subscription } = await supabase
    .from('premium_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  return NextResponse.json({
    is_premium: profile?.is_premium || false,
    premium_until: profile?.premium_until,
    subscription
  })
}
