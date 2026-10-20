// app/api/tasks/verify/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MIN_INTERACTION_SECONDS = 120

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { completionId, verified, actualDuration, clickedUrl, fraudScore } = await request.json()

    // 1. Fetch the completion record
    const { data: completion, error: fetchError } = await supabase
      .from('completed_tasks')
      .select('*, tasks(*)')
      .eq('id', completionId)
      .eq('user_id', user.id) // Security: ensure user owns this
      .single()

    if (fetchError || !completion) {
      return NextResponse.json({ error: 'Completion not found' }, { status: 404 })
    }

    // 2. Prevent double-verification
    if (completion.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Task already verified', 
        status: completion.status 
      }, { status: 400 })
    }

    // 3. Server-side Validation (The "Confirm Check")
    const isValid = 
      verified === true &&
      actualDuration >= MIN_INTERACTION_SECONDS &&
      clickedUrl === true &&
      (fraudScore || 0) < 60

    if (!isValid) {
      // Mark as rejected
      await supabase
        .from('completed_tasks')
        .update({ status: 'rejected', verified_at: new Date().toISOString() })
        .eq('id', completionId)

      return NextResponse.json({ 
        error: 'Verification failed. You did not meet the requirements.',
        status: 'rejected'
      }, { status: 400 })
    }

    // 4. Mark as Verified
    const { error: updateError } = await supabase
      .from('completed_tasks')
      .update({ 
        status: 'verified', 
        verified_at: new Date().toISOString() 
      })
      .eq('id', completionId)

    if (updateError) throw updateError

    // 5. Credit the user (If it wasn't credited during completion)
    // Note: If your /complete route already credits the balance, remove this block.
    const reward = completion.reward_spy
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('spy_balance, earned_spy')
      .eq('id', user.id)
      .single()

    if (profile) {
      await supabase
        .from('profiles')
        .update({
          spy_balance: (profile.spy_balance || 0) + reward,
          earned_spy: (profile.earned_spy || 0) + reward
        })
        .eq('id', user.id)
    }

    return NextResponse.json({ 
      success: true, 
      status: 'verified',
      reward: reward
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
