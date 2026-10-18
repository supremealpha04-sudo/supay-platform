// app/api/ads/complete/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const FIXED_REWARD = 0.05

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { adTier, platform, fraudScore } = body

    const numericFraudScore = typeof fraudScore === 'object' 
      ? (fraudScore?.fraudScore || 0) 
      : (fraudScore || 0)

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Please log in to earn rewards' }, { status: 401 })
    }
    
    const userId = user.id

    // 2. Fetch Profile (with fallback if it doesn't exist)
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('spy_balance')
      .eq('id', userId)
      .single()
    
    // ✅ FIX: If profile is missing, create it automatically
    if (profileError || !profile) {
      console.log('⚠️ Profile missing for user, creating one now...')
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email,
          username: user.email?.split('@')[0] || 'user',
          spy_balance: 0,
          is_premium: false
        })
        .select('spy_balance')
        .single()

      if (createError) {
        console.error('Failed to auto-create profile:', createError)
        return NextResponse.json({ success: false, message: 'Failed to create user profile' }, { status: 500 })
      }
      
      profile = newProfile
    }

    // 3. Check Daily Limit
    const today = new Date().toISOString().split('T')[0]
    const { count: todayCount } = await supabase
      .from('ad_watches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today)

    const dailyLimit = 20
    if (todayCount && todayCount >= dailyLimit) {
      return NextResponse.json({ success: false, message: 'Daily limit reached. Come back tomorrow!' }, { status: 400 })
    }

    // 4. Process Reward
    const reward = FIXED_REWARD

    const { error: insertError } = await supabase
      .from('ad_watches')
      .insert({
        user_id: userId,
        ad_tier: adTier || 'display',
        platform_used: platform || 'adsterra',
        reward_spy: reward,
        duration_seconds: 20,
        fraud_score: numericFraudScore,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      return NextResponse.json({ success: false, message: `DB Error: ${insertError.message}` }, { status: 500 })
    }

    // 5. Update Balance
    const newBalance = (profile.spy_balance || 0) + reward
    await supabase
      .from('profiles')
      .update({ spy_balance: newBalance })
      .eq('id', userId)

    // 6. Update Streak
    await updateStreak(userId)

    return NextResponse.json({
      success: true,
      reward: reward,
      platform: platform || 'adsterra',
      newBalance: newBalance,
      message: `+${reward} SPY earned!`
    })

  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Failed to process' }, { status: 500 })
  }
}

async function updateStreak(userId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  try {
    const { data: todayWatch } = await supabase
      .from('ad_watches')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today)
      .limit(1)
    
    if (todayWatch && todayWatch.length > 0) {
      const { data: yesterdayWatch } = await supabase
        .from('ad_watches')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', yesterday)
        .lt('created_at', today)
        .limit(1)
      
      if (yesterdayWatch && yesterdayWatch.length > 0) {
        await supabase.rpc('increment_streak', { user_id: userId })
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('daily_bonus_streak')
          .eq('id', userId)
          .single()
        
        if (profile?.daily_bonus_streak === 0 || profile?.daily_bonus_streak === null) {
          await supabase
            .from('profiles')
            .update({ daily_bonus_streak: 1 })
            .eq('id', userId)
        }
      }
    }
  } catch (error) {
    console.error('Streak error:', error)
  }
}
