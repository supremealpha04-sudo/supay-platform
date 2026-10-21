// app/api/tasks/complete/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MIN_INTERACTION_SECONDS = 60
const CLEANUP_HOURS = 72

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId, signals, taskData } = await request.json()

    // 1. Verify duration
    if (signals.actualDuration < MIN_INTERACTION_SECONDS) {
      return NextResponse.json(
        { error: `You must spend at least ${MIN_INTERACTION_SECONDS / 60} minutes on this task` },
        { status: 400 }
      )
    }

    // 2. Verify clicked
    if (!signals.clickedUrl) {
      return NextResponse.json({ error: 'You must click the task link first' }, { status: 400 })
    }

    // 3. Check if already completed
    const { data: existing } = await supabase
      .from('completed_tasks')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'verified') {
        return NextResponse.json({ error: 'Task already completed' }, { status: 400 })
      }
      // If pending or rejected, delete old record and try again
      await supabase.from('completed_tasks').delete().eq('id', existing.id)
    }

    // 4. Get task details
    let taskReward = 10
    let taskTitle = 'Task'

    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle()

    if (task) {
      taskReward = task.reward_spy
      taskTitle = task.title
    } else if (taskData) {
      taskReward = taskData.reward_spy || 10
      taskTitle = taskData.title || 'Social Task'
    }

    // 5. Get Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()

    // 6. Calculate reward
    const multiplier = profile?.is_premium ? 2 : 1
    const reward = Math.round((taskReward * multiplier) * 100) / 100

    // 7. Insert pending completion
    const expiresAt = new Date(Date.now() + CLEANUP_HOURS * 60 * 60 * 1000).toISOString()

    const { data: completion, error: insertError } = await supabase
      .from('completed_tasks')
      .insert({
        user_id: user.id,
        task_id: taskId,
        reward_spy: reward,
        status: 'pending',
        verified_at: null,
        expires_at: expiresAt,
        fraud_score: signals.fraudScore || 0,
        signals: signals,
        task_title: taskTitle,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to record completion: ' + insertError.message }, { status: 500 })
    }

    // 8. Update task counter
    if (task) {
      await supabase
        .from('tasks')
        .update({ total_completions: (task.total_completions || 0) + 1 })
        .eq('id', taskId)
    }

    // 9. Return completion ID
    return NextResponse.json({
      success: true,
      completionId: completion.id,
      message: 'Task submitted for verification'
    })

  } catch (error) {
    console.error('Task completion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
