// app/api/tasks/verify/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MIN_INTERACTION_SECONDS = 120

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { completionId, actualDuration, clickedUrl, fraudScore } = await request.json()

    // 1. Get completion
    const { data: completion, error: fetchError } = await supabase
      .from('completed_tasks')
      .select('*')
      .eq('id', completionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !completion) {
      return NextResponse.json({ success: false, error: 'Completion not found' }, { status: 404 })
    }

    // 2. If already verified, don't double-credit
    if (completion.status === 'verified') {
      return NextResponse.json({ success: true, status: 'verified', reward: completion.reward_spy })
    }

    // 3. Validate
    if (actualDuration < MIN_INTERACTION_SECONDS || clickedUrl !== true || (fraudScore || 0) >= 60) {
      await supabase.from('completed_tasks').update({ status: 'rejected' }).eq('id', completionId)
      return NextResponse.json({ success: false, error: 'Requirements not met' }, { status: 400 })
    }

    // 4. Mark as verified
    await supabase.from('completed_tasks').update({ 
      status: 'verified', 
      verified_at: new Date().toISOString() 
    }).eq('id', completionId)

    // 5. CREDIT USER BALANCE (Fix for "earn spy")
    const { data: profile } = await supabase
      .from('profiles')
      .select('spy_balance, earned_spy')
      .eq('id', user.id)
      .single()

    if (profile) {
      const newBalance = (profile.spy_balance || 0) + completion.reward_spy
      const newEarned = (profile.earned_spy || 0) + completion.reward_spy

      // Update both balance AND earned_spy
      await supabase.from('profiles').update({
        spy_balance: newBalance,
        earned_spy: newEarned,
      }).eq('id', user.id)

      // Update the breakdown table if you use it for the dashboard stats
      await supabase.from('user_spy_breakdown').upsert({
        user_id: user.id,
        earned_spy: newEarned,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

      // Log transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'task_complete',
        amount_spy: completion.reward_spy,
        balance_after: newBalance,
        description: `Completed: ${completion.task_title || 'Task'}`,
      })
    }

    // 6. AUTO-DELETE: Remove from completed_tasks after 24h (or mark as done)
    // Actually, let's mark it as 'claimed' and delete expired ones
    // For now, let's auto-delete the pending session
    
    // Clean up any task_sessions related to this
    await supabase.from('task_sessions').delete().eq('user_id', user.id).eq('task_id', completion.task_id)

    return NextResponse.json({
      success: true,
      status: 'verified',
      reward: completion.reward_spy
    })

  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
