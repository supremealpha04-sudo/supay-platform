// app/api/ads/complete/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const FIXED_REWARD = 0.05
const DAILY_LIMIT = 20
const MAX_FRAUD_SCORE = 0.6 // reject above this
const AD_TIER_DURATION: Record<string, number> = {
  display: 10,
  video: 30,
  popunder: 5,
  interstitial: 15,
}

// ---- helpers --------------------------------------------------------------

/** Returns [startOfTodayISO, startOfYesterdayISO] in the user's local timezone
 *  If the request carries a `x-timezone-offset` header (minutes east of UTC),
 *  we use it; otherwise fall back to UTC day.
 */
function getDayBounds(offsetMinutes = 0): { startToday: string; startYesterday: string } {
  const now = new Date()
  const utcMs = now.getTime() + offsetMinutes * 60_000
  const local = new Date(utcMs)

  local.setUTCHours(0, 0, 0, 0)
  const startToday = new Date(local.getTime() - offsetMinutes * 60_000).toISOString()

  local.setUTCDate(local.getUTCDate() - 1)
  const startYesterday = new Date(local.getTime() - offsetMinutes * 60_000).toISOString()

  return { startToday, startYesterday }
}

// ---- route ---------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json().catch(() => ({}))
    const { adTier, platform, fraudScore } = body ?? {}

    // Normalise fraud score (object or number)
    const numericFraudScore =
      typeof fraudScore === 'object'
        ? Number(fraudScore?.fraudScore ?? 0)
        : Number(fraudScore ?? 0)

    // ---- 1. Auth ----
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Please log in to earn rewards' },
        { status: 401 }
      )
    }
    const userId = user.id

    // ---- 2. Fraud gate (BEFORE we spend any DB writes) ----
    if (numericFraudScore > MAX_FRAUD_SCORE) {
      // Fire-and-forget log; do not fail the request on log failure
      supabase
        .from('fraud_logs')
        .insert({
          user_id: userId,
          ad_tier: adTier || 'display',
          platform_used: platform || 'adsterra',
          fraud_score: numericFraudScore,
          signals: typeof fraudScore === 'object' ? fraudScore : { raw: fraudScore },
        })
        .then(() => {}, () => {})

      return NextResponse.json(
        { success: false, message: 'Suspicious activity detected. Please try again.' },
        { status: 400 }
      )
    }

    // ---- 3. Profile: read, or create if missing ----
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('spy_balance, daily_bonus_streak, is_premium')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      const { data: created, error: createErr } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email,
          username: user.email?.split('@')[0] || `user_${userId.slice(0, 6)}`,
          spy_balance: 0,
          is_premium: false,
          daily_bonus_streak: 0,
        })
        .select('spy_balance, daily_bonus_streak, is_premium')
        .single()

      if (createErr || !created) {
        return NextResponse.json(
          { success: false, message: 'Failed to create user profile' },
          { status: 500 }
        )
      }
      profile = created
    }

    // ---- 4. Day bounds + daily limit ----
    const tzOffset = Number(request.headers.get('x-timezone-offset') ?? 0) || 0
    const { startToday, startYesterday } = getDayBounds(tzOffset)

    const { count: todayCount, error: countErr } = await supabase
      .from('ad_watches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startToday)

    if (countErr) {
      return NextResponse.json(
        { success: false, message: `DB Error: ${countErr.message}` },
        { status: 500 }
      )
    }

    if ((todayCount ?? 0) >= DAILY_LIMIT) {
      return NextResponse.json(
        { success: false, message: 'Daily limit reached. Come back tomorrow!' },
        { status: 400 }
      )
    }

    // ---- 5. Reward ----
    const reward = FIXED_REWARD
    const duration = AD_TIER_DURATION[adTier] ?? 20
    const resolvedPlatform = platform || 'adsterra'

    // ---- 6. Insert ad_watch ----
    const { error: insertError } = await supabase.from('ad_watches').insert({
      user_id: userId,
      ad_tier: adTier || 'display',
      platform_used: resolvedPlatform,
      reward_spy: reward,
      duration_seconds: duration,
      fraud_score: numericFraudScore,
    })

    if (insertError) {
      return NextResponse.json(
        { success: false, message: `DB Error: ${insertError.message}` },
        { status: 500 }
      )
    }

    // ---- 7. Atomic balance update via RPC ----
    const { data: rpcData, error: rpcErr } = await supabase.rpc('increment_spy_balance', {
      user_id: userId,
      amount: reward,
    })

    // Fallback if RPC doesn't exist
    let newBalance: number
    if (rpcErr) {
      console.warn('increment_spy_balance RPC failed, using fallback update:', rpcErr.message)
      // Re-read and write (still racy, but at least works without RPC)
      const { data: fresh } = await supabase
        .from('profiles')
        .select('spy_balance')
        .eq('id', userId)
        .single()
      newBalance = Number(fresh?.spy_balance ?? 0) + reward
      await supabase.from('profiles').update({ spy_balance: newBalance }).eq('id', userId)
    } else {
      newBalance = Number(
        (rpcData as any)?.new_balance ?? (profile.spy_balance ?? 0) + reward
      )
    }

    // ---- 8. Insert into transactions (THE WALLET BUG FIX) ----
    const { error: txErr } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'ad_reward',           // matches wallet icon switch
      amount_spy: reward,          // wallet reads `amount_spy`
      balance_after: newBalance,
      status: 'completed',         // wallet only shows status='completed'
      description: `${adTier || 'display'} ad on ${resolvedPlatform}`,
      metadata: {
        platform: resolvedPlatform,
        ad_tier: adTier || 'display',
        duration,
        fraud_score: numericFraudScore,
      },
    })

    if (txErr) {
      // Non-fatal: user got the balance but no ledger entry — log loudly
      console.error('❌ transactions insert failed (wallet will be empty):', txErr)
    }

    // ---- 9. Streak (guarded to once/day) ----
    await updateStreak(supabase, userId, startToday, startYesterday, profile.daily_bonus_streak)

    return NextResponse.json({
      success: true,
      reward,
      platform: resolvedPlatform,
      newBalance,
      message: `+${reward} SPY earned!`,
    })
  } catch (error) {
    console.error('ads/complete unexpected error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to process' },
      { status: 500 }
    )
  }
}

// ---- streak ---------------------------------------------------------------

async function updateStreak(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  startToday: string,
  startYesterday: string,
  currentStreak: number | null
) {
  try {
    // Only increment if we have NOT already counted today.
    // The first ad of the day was just inserted, so we check the count for today.
    const { count: todayWatches } = await supabase
      .from('ad_watches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startToday)

    // If more than 1 ad today → the streak was already handled by the first one.
    if ((todayWatches ?? 0) > 1) return

    const { count: yesterdayWatches } = await supabase
      .from('ad_watches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startYesterday)
      .lt('created_at', startToday)

    if ((yesterdayWatches ?? 0) > 0) {
      // Consecutive day → increment
      const { error } = await supabase.rpc('increment_streak', { user_id: userId })
      if (error) {
        // Fallback
        await supabase
          .from('profiles')
          .update({ daily_bonus_streak: (currentStreak ?? 0) + 1 })
          .eq('id', userId)
      }
    } else {
      // Streak broken (or first ever) → reset to 1
      await supabase.from('profiles').update({ daily_bonus_streak: 1 }).eq('id', userId)
    }
  } catch (err) {
    console.error('Streak error:', err)
  }
}
