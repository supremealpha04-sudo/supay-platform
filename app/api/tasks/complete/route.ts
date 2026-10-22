// app/api/tasks/complete/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { taskId, signals, taskData } = body

    console.log('📝 Task completion request:', { taskId, fraudScore: signals?.fraudScore })

    // 1. Validate Fraud Score
    if (signals?.fraudScore >= 60) {
      console.log('🚫 Fraud detected:', signals.fraudScore)
      return NextResponse.json({ success: false, error: 'Fraud detected' }, { status: 400 })
    }

    // 2. Get Session (Critical for Vercel)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
      return NextResponse.json({ success: false, error: 'Session error' }, { status: 401 })
    }
    
    if (!session) {
      console.error('❌ No session found')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    console.log('✅ Authenticated user:', userId)

    // 3. Check if task already completed
    const { data: existing, error: checkError } = await supabase
      .from('completed_tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Check existing error:', checkError)
    }

    if (existing) {
      console.log('⚠️ Task already completed')
      return NextResponse.json({ success: false, error: 'Task already completed' }, { status: 400 })
    }

    // 4. Prepare data
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    const reward = taskData?.reward_spy || 10

    console.log('💾 Inserting completion record...', { userId, taskId, reward })

    // 5. Insert Completion Record
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
      console.error('❌ Insert error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      })
      
      // Check for specific constraint errors
      if (insertError.code === '23503') {
        return NextResponse.json({ success: false, error: 'User profile not found. Please log out and log in again.' }, { status: 500 })
      }
      
      return NextResponse.json({ success: false, error: 'Failed to save completion: ' + insertError.message }, { status: 500 })
    }

    console.log('✅ Completion saved:', completion.id)

    // 6. Update User Balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('spy_balance, earned_spy')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('❌ Profile fetch error:', profileError)
      // Still return success for the task, but log the balance error
      return NextResponse.json({ 
        success: true, 
        reward, 
        completionId: completion.id, 
        expiresAt,
        message: 'Task saved but balance update failed'
      })
    }

    const newBalance = (profile.spy_balance || 0) + reward
    const newEarned = (profile.earned_spy || 0) + reward

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        spy_balance: newBalance,
        earned_spy: newEarned
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Profile update error:', updateError)
      return NextResponse.json({ 
        success: true, 
        reward, 
        completionId: completion.id, 
        expiresAt,
        message: 'Task saved but balance update failed'
      })
    }

    console.log('✅ Balance updated:', newBalance)

    // 7. Log Transaction
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'task_reward',
      amount_spy: reward,
      balance_before: profile.spy_balance || 0,
      balance_after: newBalance,
      description: `Completed task: ${taskData?.title || 'Task'}`,
    })

    if (txError) {
      console.error('❌ Transaction log error:', txError)
      // Don't fail the request, just log it
    }

    return NextResponse.json({
      success: true,
      reward,
      completionId: completion.id,
      expiresAt,
      newBalance
    })

  } catch (error) {
    console.error('❌ Task completion error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
