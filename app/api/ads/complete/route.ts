// app/api/ads/complete/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const FIXED_REWARD = 0.05

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { adTier, platform, fraudScore } = body
    
    console.log('📝 Ad completion request:', { adTier, platform })

    // ✅ FIX 1: Use getUser() instead of getSession() for server-side auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ 
        success: false, 
        message: 'Please log in to earn rewards' 
      }, { status: 401 })
    }
    
    const userId = user.id
    console.log('✅ User authenticated:', userId)

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, spy_balance')
      .eq('id', userId)
      .single()
    
    if (profileError || !profile) {
      console.error('❌ Profile error:', profileError)
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

    // ✅ FIX 2: Insert WITHOUT .select() to avoid needing a SELECT RLS policy
    // This is the most common cause of "Failed to record" errors [citation:2][citation:10]
    const { error: insertError } = await supabase
      .from('ad_watches')
      .insert({
        user_id: userId,
        ad_tier: adTier || 'display',
        platform_used: platform || 'adsterra',
        reward_spy: reward,
        duration_seconds: 20,
        fraud_score: fraudScore || 0,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('❌ Insert error:', insertError)
      return NextResponse.json({ 
        success: false, 
        message: `DB Error: ${insertError.message}` 
      }, { status: 500 })
    }

    // ✅ FIX 3: Update balance using RPC or direct update
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

// (Keep your existing updateStreak function below)
async function updateStreak(userId: string) {
  // ... your existing streak logic ...
}
