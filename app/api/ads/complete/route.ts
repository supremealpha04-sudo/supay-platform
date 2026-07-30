// app/api/ads/complete/route.ts
import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { adTier, platform, fraudSignals, fraudScore } = body
    
    console.log('📝 Ad completion request:', { adTier, platform })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 })
    }
    
    const userId = session.user.id

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, spy_balance')
      .eq('id', userId)
      .single()
    
    if (profileError || !profile) {
      console.error('❌ Profile fetch error:', profileError)
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]
    const { count: todayCount, error: countError } = await supabase
      .from('ad_watches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today)

    if (countError) {
      console.error('❌ Count error:', countError)
    }

    const dailyLimit = profile.is_premium ? 30 : 20
    if (todayCount && todayCount >= dailyLimit) {
      return NextResponse.json({ 
        success: false, 
        message: 'Daily limit reached. Come back tomorrow!' 
      }, { status: 400 })
    }

    const reward = calculateReward(adTier, profile.is_premium)
    console.log('💰 Calculated reward:', reward)

    const { error: insertError } = await supabase
      .from('ad_watches')
      .insert({
        user_id: userId,
        ad_tier: adTier,
        platform_used: platform || 'adsterra',
        reward_spy: reward,
        duration_seconds: getDurationForTier(adTier),
        fraud_score: fraudScore || 0,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('❌ Error recording ad watch:', insertError)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to record ad watch' 
      }, { status: 500 })
    }

    // Update user balance
    const { error: updateError } = await supabase.rpc('increment_spy_balance', {
      user_id: userId,
      amount: reward
    })

    if (updateError) {
      console.error('❌ Error updating balance:', updateError)
    }

    await updateStreak(userId)

    return NextResponse.json({
      success: true,
      reward: reward,
      platform: platform || 'adsterra',
      userTier: profile.is_premium ? 'premium' : 'standard',
      message: `+${reward} SPY earned!`
    })

  } catch (error) {
    console.error('❌ Complete API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to process ad completion'
    }, { status: 500 })
  }
}

function calculateReward(tier: string, isPremium: boolean): number {
  const baseRates: Record<string, number> = {
    'display': 0.45, // 3 ads × 0.15
    'video': 1.00    // 2 ads × 0.50
  }
  
  const baseRate = baseRates[tier] || 0.10
  const premiumMultiplier = isPremium ? 2.0 : 1.0
  
  return Math.round((baseRate * premiumMultiplier) * 100) / 100
}

function getDurationForTier(tier: string): number {
  const durations: Record<string, number> = {
    'display': 75,  // 3 ads × 25s
    'video': 60     // 2 ads × 30s
  }
  return durations[tier] || 10
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
        
        if (profile?.daily_bonus_streak === 0) {
          await supabase
            .from('profiles')
            .update({ daily_bonus_streak: 1 })
            .eq('id', userId)
        }
      }
    }
  } catch (error) {
    console.error('Streak update error:', error)
  }
}