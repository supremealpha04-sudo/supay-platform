// app/api/ads/complete/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { adTier, platform, fraudSignals, fraudScore } = body
    
    console.log('📝 Ad completion request:', { adTier, platform })

    // Get user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 })
    }
    
    const userId = session.user.id

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, spy_balance')
      .eq('id', userId)
      .single()
    
    if (!profile) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 })
    }

    // Calculate reward (simple version for testing)
    const reward = calculateReward(adTier, platform, profile.is_premium)
    console.log('💰 Calculated reward:', reward)

    // Record the ad watch
    const { error } = await supabase
      .from('ad_watches')
      .insert({
        user_id: userId,
        ad_tier: adTier,
        platform_used: platform,
        reward_spy: reward,
        duration_seconds: getDurationForTier(adTier),
        fraud_score: fraudScore || 0,
        timestamp: new Date().toISOString()
      })

    if (error) {
      console.error('❌ Error recording ad watch:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to record ad watch' 
      }, { status: 500 })
    }

    // Update user balance
    await supabase.rpc('increment_spy_balance', {
      user_id: userId,
      amount: reward
    })

    return NextResponse.json({
      success: true,
      reward: reward,
      platform: platform,
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

function calculateReward(tier: string, platform: string, isPremium: boolean): number {
  // Simple reward calculation for testing
  const baseRates: Record<string, Record<string, number>> = {
    'adsterra': {
      'display': 0.15,
      'video': 1.00,
      'popunder': 0.10
    },
    'monetag': {
      'display': 0.10,
      'popunder': 0.08
    }
  }
  
  const baseRate = baseRates[platform]?.[tier] || 0.10
  const premiumMultiplier = isPremium ? 2.0 : 1.0
  
  return Math.round((baseRate * premiumMultiplier) * 100) / 100
}

function getDurationForTier(tier: string): number {
  const durations: Record<string, number> = {
    'display': 10,
    'video': 30,
    'popunder': 5
  }
  return durations[tier] || 10
}