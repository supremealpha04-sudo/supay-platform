// app/api/tasks/verify/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    // 4. If already verified, return success immediately (Idempotent)
    if (completion.status === 'verified') {
      return NextResponse.json({ 
        success: true, 
        status: 'verified', 
        reward: completion.reward_spy 
      })
    }

    // 5. If already rejected, return error
    if (completion.status === 'rejected') {
      return NextResponse.json({ 
        success: false, 
        error: 'Task was rejected' 
      }, { status: 400 })
    }

    // 6. Validate requirements
    const isValid = 
      actualDuration >= 120 && 
      clickedUrl === true && 
      (fraudScore || 0) < 60

    if (!isValid) {
      // Mark as rejected
      await supabase
        .from('completed_tasks')
        .update({ status: 'rejected', verified_at: new Date().toISOString() })
        .eq('id', completionId)

      return NextResponse.json({ 
        success: false, 
        error: 'Requirements not met (duration or interaction)' 
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
      return NextResponse.json({ success: false, error: 'Database update failed' }, { status: 500 })
    }

    // 8. Credit User Balance (Important!)
    // Get current profile
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
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
