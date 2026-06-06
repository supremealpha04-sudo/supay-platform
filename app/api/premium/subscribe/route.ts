// app/api/premium/subscribe/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const PREMIUM_COSTS = { Silver: 500, Gold: 2000, Platinum: 5000 }

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { tier } = await request.json()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cost = PREMIUM_COSTS[tier as keyof typeof PREMIUM_COSTS]

  if (!cost) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('spy_balance, premium_until')
    .eq('id', user.id)
    .single()

  if ((profile?.spy_balance || 0) < cost) {
    return NextResponse.json({ error: 'Insufficient SPY' }, { status: 400 })
  }

  const currentEnd = profile?.premium_until ? new Date(profile.premium_until) : new Date()
  const newEnd = new Date(currentEnd)
  newEnd.setMonth(newEnd.getMonth() + 1)

  const newBalance = (profile?.spy_balance || 0) - cost

  await supabase
    .from('profiles')
    .update({
      spy_balance: newBalance,
      is_premium: true,
      premium_until: newEnd.toISOString()
    })
    .eq('id', user.id)

  await supabase.from('premium_subscriptions').insert({
    user_id: user.id,
    tier,
    cost_spy: cost,
    start_date: new Date().toISOString(),
    end_date: newEnd.toISOString(),
    auto_renew: true,
    is_active: true
  })

  return NextResponse.json({ success: true, premium_until: newEnd })
}
