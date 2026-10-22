// app/api/tasks/complete/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { taskId, signals, taskData } = body

    if (signals.fraudScore >= 60) {
      return NextResponse.json({ success: false, error: 'Fraud detected' }, { status: 400 })
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const { data: existing } = await supabase
      .from('completed_tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: false, error: 'Task already completed' }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    const reward = taskData?.reward_spy || 10

    const { data: completion, error: insertError } = await supabase
      .from('completed_tasks')
      .insert({
        user_id: userId,
        task_id: taskId,
        reward_spy: reward,
        status: 'verified',
        verified_at: new Date().toISOString(),
        expires_at: expiresAt,
        task_title: taskData?.title || 'Task',
        signals: signals
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ success: false, error: 'Failed to save completion' }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('spy_balance, earned_spy')
      .eq('id', userId)
      .single()

    const newBalance = (profile?.spy_balance || 0) + reward
    const newEarned = (profile?.earned_spy || 0) + reward

    await supabase
      .from('profiles')
      .update({ 
        spy_balance: newBalance,
        earned_spy: newEarned
      })
      .eq('id', userId)

    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'task_reward',
      amount_spy: reward,
      balance_before: profile?.spy_balance || 0,
      balance_after: newBalance,
      description: `Completed task: ${taskData?.title || 'Task'}`,
    })

    return NextResponse.json({
      success: true,
      reward,
      completionId: completion.id,
      expiresAt,
      newBalance
    })

  } catch (error) {
    console.error('Task completion error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
