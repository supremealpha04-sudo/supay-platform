// app/api/ads/complete/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const FIXED_REWARD = 0.05

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { adTier, platform, fraudSignals, fraudScore } = body
    
    console.log('📝 Ad completion request:', { adTier, platform })

    // ✅ FIX: Extract the actual number from the fraudScore object
    const numericFraudScore = typeof fraudScore === 'object' 
      ? (fraudScore?.fraudScore || 0) 
      : (fraudScore || 0)

    // Get user (using getUser for server-side auth)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please log in to earn rewards' 
      }, { status: 401 })
    }
    
    const userId = user.id

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, spy_balance')
      .eq('id', userId)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false, 
        message: 'User profile not found' 
      }, { status: 404 })
    }

    // Check daily limit
    const today = new Date().toISOString().split('T')[0]
    const { count: todayCount } = await supabase
      .from('ad_watches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today)

    const dailyLimit = 20
    if (todayCount && todayCount >= dailyLimit) {
      return NextResponse.json({ 
        success: false, 
        message: 'Daily limit reached. Come back tomorrow!' 
      }, { status: 400 })
    }

    // Calculate reward
    const reward = profile.is_premium ? FIXED_REWARD * 2 : FIXED_REWARD

    // Insert ad watch (with numeric fraud_score)
    const { error: insertError } = await supabase
      .from('ad_watches')
      .insert({
        user_id: userId,
        ad_tier: adTier || 'display',
        platform_used: platform || 'adsterra',
        reward_spy: reward,
        duration_seconds: 20,
        fraud_score: numericFraudScore,  // ✅ Now a number
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('❌ Insert error:', insertError)
      return NextResponse.json({ 
        success: false, 
        message: `DB Error: ${insertError.message}` 
      }, { status: 500 })
    }

    // Update balance
    const newBalance = (profile.spy_balance || 0) + reward
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ spy_balance: newBalance })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Update error:', updateError)
    }

    // Update streak
    await updateStreak(userId)

    return NextResponse.json({
      success: true,
      reward: reward,
      platform: platform || 'adsterra',
      userTier: profile.is_premium ? 'premium' : 'standard',
      newBalance: newBalance,
      message: `+${reward} SPY earned!`
    })

  } catch (error) {
    console.error('❌ Complete API error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process'
    }, { status: 500 })
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
