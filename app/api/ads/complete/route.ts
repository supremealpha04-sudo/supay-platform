import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { calculateReward, getUserTier } from '@/lib/ads/rewards'

function validateServerSide(signals: any, headers: Headers) {
  const clientTimestamp = signals?.timestamp
  if (clientTimestamp) {
    const drift = Math.abs(Date.now() - clientTimestamp)
    if (drift > 30000) return { valid: false, reason: 'Timestamp drift' }
  }

  const clientUA = signals?.userAgent
  const serverUA = headers.get('user-agent')
  if (clientUA && serverUA && !serverUA.includes(clientUA.slice(0, 50))) {
    return { valid: false, reason: 'UA mismatch' }
  }

  const expected = signals?.expectedDuration || 15
  const actual = signals?.actualDuration || 0
  if (actual < expected * 0.85) {
    return { valid: false, reason: `Too short: ${actual.toFixed(1)}s` }
  }

  return { valid: true }
}

export async function POST(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookies().get(name)?.value },
        set(name: string, value: string, options: any) { cookies().set({ name, value, ...options }) },
        remove(name: string, options: any) { cookies().set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

  const { data: profileCheck } = await supabase
    .from('profiles').select('is_banned, ban_reason').eq('id', user.id).single()

  if (profileCheck?.is_banned) {
    return NextResponse.json({ success: false, message: `Suspended: ${profileCheck.ban_reason}` }, { status: 403 })
  }

  const body = await request.json()
  const { adTier, fraudSignals, fraudScore } = body

  const validation = validateServerSide(fraudSignals, request.headers)
  if (!validation.valid) {
    await supabase.from('fraud_reports').insert({
      user_id: user.id,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      fraud_score: 100,
      fraud_flags: [{ type: 'server', severity: 'critical', message: validation.reason }],
      reason: 'server_rejected',
      created_at: new Date().toISOString(),
    })
    return NextResponse.json({ success: false, message: `Blocked: ${validation.reason}` }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const { count: dailyCount } = await supabase
    .from('ad_watches').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).gte('created_at', today)

  const limits: Record<string, number> = { cpm: 20, cpc: 10, cpa: 5, premium_video: 10, offerwall: 3 }
  if ((dailyCount || 0) >= (limits[adTier] || 20)) {
    return NextResponse.json({ success: false, message: 'Daily limit reached' }, { status: 400 })
  }

  const { data: lastWatch } = await supabase
    .from('ad_watches').select('created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()

  if (lastWatch && (Date.now() - new Date(lastWatch.created_at).getTime()) / 1000 < 30) {
    return NextResponse.json({ success: false, message: 'Cooldown active' }, { status: 400 })
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: hourlyCount } = await supabase
    .from('ad_watches').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).gte('created_at', oneHourAgo)

  if ((hourlyCount || 0) >= 5) {
    return NextResponse.json({ success: false, message: 'Hourly limit reached' }, { status: 429 })
  }

  const { data: profile } = await supabase.from('profiles')
    .select('spy_balance, total_earned_usd, daily_ad_watch_count, last_ad_watch_at, is_premium')
    .eq('id', user.id).single()

  if (!profile) return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 })

  const userTier = await getUserTier(user.id, supabase)
  const rewardResult = calculateReward(adTier, userTier, profile.is_premium || false)
  const finalReward = rewardResult.reward

  await supabase.from('ad_watches').insert({
    user_id: user.id,
    reward_spy: finalReward,
    ad_tier: adTier,
    fraud_score: fraudScore?.score || 0,
    fraud_flags: fraudScore?.flags?.map((f: any) => f.type) || [],
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent')?.slice(0, 500),
    platform_earnings: rewardResult.platformEarnings,
    platform_profit: rewardResult.platformProfit,
    created_at: new Date().toISOString(),
  })

  const newBalance = profile.spy_balance + finalReward
  await supabase.from('profiles').update({
    spy_balance: newBalance,
    total_earned_usd: (profile.total_earned_usd || 0) + (finalReward * 0.01),
    daily_ad_watch_count: (profile.daily_ad_watch_count || 0) + 1,
    last_ad_watch_at: new Date().toISOString(),
  }).eq('id', user.id)

  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'ad_reward',
    amount_spy: finalReward,
    balance_before: profile.spy_balance,
    balance_after: newBalance,
    metadata: {
      ad_tier: adTier,
      user_tier: userTier,
      fraud_score: fraudScore?.score,
      platform_earnings: rewardResult.platformEarnings,
      platform_profit: rewardResult.platformProfit,
    },
  })

  return NextResponse.json({
    success: true,
    reward: finalReward,
    newBalance,
    adTier,
    userTier,
    platformProfit: rewardResult.platformProfit,
  })
}
