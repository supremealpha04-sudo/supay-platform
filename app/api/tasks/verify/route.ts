// app/api/tasks/verify/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MIN_INTERACTION_SECONDS = 120

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 1. Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse body
    const body = await request.json()
    const { completionId, actualDuration, clickedUrl, fraudScore } = body

    if (!completionId) {
      return NextResponse.json({ success: false, error: 'Missing completion ID' }, { status: 400 })
    }

    // 3. Get completion record
    const { data: completion, error: fetchError } = await supabase
      .from('completed_tasks')
      .select('*')
      .eq('id', completionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !completion) {
      console.error('Completion fetch error:', fetchError)
      return NextResponse.json({ success: false, error: 'Completion not found' }, { status: 404 })
    }

    // 4. Already verified? Return success (idempotent)
    if (completion.status === 'verified') {
      return NextResponse.json({ 
        success: true, 
        status: 'verified', 
        reward: completion.reward_spy 
      })
    }

    // 5. Already rejected? Return error
    if (completion.status === 'rejected') {
      return NextResponse.json({ 
        success: false, 
        error: 'Task was rejected' 
      }, { status: 400 })
    }

    // 6. Validate requirements
    const isValid = 
      actualDuration >= MIN_INTERACTION_SECONDS && 
      clickedUrl === true && 
      (fraudScore || 0) < 60

    if (!isValid) {
      await supabase
        .from('completed_tasks')
        .update({ status: 'rejected', verified_at: new Date().toISOString() })
        .eq('id', completionId)

      return NextResponse.json({ 
        success: false, 
        error: 'Requirements not met' 
      }, { status: 400 })
    }

    // 7. Mark as verified
    const { error: updateError } = await supabase
      .from('completed_tasks')
      .update({ 
        status: 'verified', 
        verified_at: new Date().toISOString() 
      })
      .eq('id', completionId)

    if (updateError) {
      console.error('Verify update error:', updateError)
      return NextResponse.json({ success: false, error: 'Database update failed: ' + updateError.message }, { status: 500 })
    }

    // 8. Credit User Balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('spy_balance, earned_spy')
      .eq('id', user.id)
      .single()

    if (profile) {
      const newBalance = (profile.spy_balance || 0) + completion.reward_spy
      const newEarned = (profile.earned_spy || 0) + completion.reward_spy

      await supabase
        .from('profiles')
        .update({ 
          spy_balance: newBalance,
          earned_spy: newEarned
        })
        .eq('id', user.id)
        
      // Log transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'task_complete',
        amount_spy: completion.reward_spy,
        balance_after: newBalance,
        description: `Completed task: ${completion.task_title || 'Task'}`,
      })
    }

    // 9. Return success
    return NextResponse.json({
      success: true,
      status: 'verified',
      reward: completion.reward_spy
    })

  } catch (error) {
    console.error('Verify API Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error: ' + (error as Error).message }, { status: 500 })
  }
}
