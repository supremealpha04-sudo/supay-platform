import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookies().set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookies().set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const { reward, duration } = await request.json()
  
  if (duration < 10) {
    return NextResponse.json({ success: false, message: 'Invalid ad duration' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('spy_balance, total_earned_usd, daily_ad_watch_count, last_ad_watch_at, is_premium')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 })
  }

  const today = new Date().toISOString().split('T')[0]
  const { count } = await supabase
    .from('ad_watches')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today)

  const DAILY_LIMIT = 20
  if ((count || 0) >= DAILY_LIMIT) {
    return NextResponse.json({ success: false, message: 'Daily limit reached' }, { status: 400 })
  }

  if (profile.last_ad_watch_at) {
    const lastTime = new Date(profile.last_ad_watch_at).getTime()
    const now = Date.now()
    if ((now - lastTime) / 1000 < 30) {
      return NextResponse.json({ success: false, message: 'Cooldown active' }, { status: 400 })
    }
  }

  const multiplier = profile.is_premium ? 2 : 1
  const finalReward = reward * multiplier

  const { error: adError } = await supabase
    .from('ad_watches')
    .insert({
      user_id: user.id,
      reward_spy: finalReward,
      watch_duration: duration,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    })

  if (adError) {
    return NextResponse.json({ success: false, message: 'Failed to record ad' }, { status: 500 })
  }

  const newBalance = profile.spy_balance + finalReward
  const newTotalEarned = (profile.total_earned_usd || 0) + (finalReward / 100)
  
  await supabase
    .from('profiles')
    .update({
      spy_balance: newBalance,
      total_earned_usd: newTotalEarned,
      daily_ad_watch_count: (profile.daily_ad_watch_count || 0) + 1,
      last_ad_watch_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      type: 'ad_reward',
      amount_spy: finalReward,
      balance_before: profile.spy_balance,
      balance_after: newBalance,
      metadata: { duration, reward }
    })

  return NextResponse.json({ success: true, reward: finalReward, newBalance })
}