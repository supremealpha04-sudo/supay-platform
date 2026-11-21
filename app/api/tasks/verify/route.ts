// app/api/tasks/complete/route.ts
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // --- Parse body safely ---
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { taskId, signals, taskData } = body

    console.log('📝 Task completion request:', {
      taskId,
      fraudScore: signals?.fraudScore,
    })

    // --- Validate inputs ---
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Missing taskId' },
        { status: 400 }
      )
    }

    if (!signals || typeof signals.fraudScore !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Missing fraud signals' },
        { status: 400 }
      )
    }

    if (signals.fraudScore >= 60) {
      console.log('🚫 Fraud detected:', signals.fraudScore)
      return NextResponse.json(
        { success: false, error: 'Fraud detected' },
        { status: 400 }
      )
    }

    // --- Auth: getUser() validates against Auth server; getSession() doesn't ---
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('❌ Auth error:', authError.message)
      return NextResponse.json(
        { success: false, error: 'Session error' },
        { status: 401 }
      )
    }

    if (!user) {
      console.error('❌ No user found')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id
    console.log('✅ Authenticated user:', userId)

    // --- Duplicate check ---
    const { data: existing, error: checkError } = await supabase
      .from('completed_tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Duplicate check error:', checkError)
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      )
    }

    if (existing) {
      console.log('⚠️ Task already completed')
      return NextResponse.json(
        { success: false, error: 'Task already completed' },
        { status: 400 }
      )
    }

    // --- Insert completion ---
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    const reward = Number(taskData?.reward_spy) || 10

    console.log('💾 Inserting completion:', { userId, taskId, reward })

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
        signals: signals,
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Insert error:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      })

      if (insertError.code === '23503') {
        return NextResponse.json(
          {
            success: false,
            error: 'User profile not found. Please log out and log in again.',
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Failed to save completion: ' + insertError.message },
        { status: 500 }
      )
    }

    console.log('✅ Completion saved:', completion.id)

    // --- Update balance ---
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('spy_balance, earned_spy')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('❌ Profile fetch error:', profileError)
      return NextResponse.json({
        success: true,
        reward,
        completionId: completion.id,
        expiresAt,
        message: 'Task saved but balance update failed',
      })
    }

    const oldBalance = Number(profile.spy_balance) || 0
    const oldEarned = Number(profile.earned_spy) || 0
    const newBalance = oldBalance + reward
    const newEarned = oldEarned + reward

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ spy_balance: newBalance, earned_spy: newEarned })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Profile update error:', updateError)
      // Roll back completion so user can retry cleanly
      await supabase.from('completed_tasks').delete().eq('id', completion.id)
      return NextResponse.json(
        { success: false, error: 'Failed to update balance. Please retry.' },
        { status: 500 }
      )
    }

    console.log('✅ Balance updated:', newBalance)

    // --- Log transaction (non-fatal) ---
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'task_reward',
      amount_spy: reward,
      balance_before: oldBalance,
      balance_after: newBalance,
      description: `Completed task: ${taskData?.title || 'Task'}`,
    })

    if (txError) {
      console.error('❌ Transaction log error (non-fatal):', txError)
    }

    return NextResponse.json({
      success: true,
      reward,
      completionId: completion.id,
      expiresAt,
      newBalance,
    })
  } catch (error: any) {
    console.error('❌ Task completion error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
