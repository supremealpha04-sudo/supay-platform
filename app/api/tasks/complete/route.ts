import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { taskId } = await request.json()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const { data: existing } = await supabase
    .from('completed_tasks')
    .select('id')
    .eq('user_id', user.id)
    .eq('task_id', taskId)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Task already completed' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, spy_balance')
    .eq('id', user.id)
    .single()

  const multiplier = profile?.is_premium ? 2 : 1
  const reward = task.reward_spy * multiplier

  await supabase.from('completed_tasks').insert({
    user_id: user.id,
    task_id: taskId,
    reward_spy: reward,
    status: 'verified',
    verified_at: new Date().toISOString()
  })

  await supabase
    .from('tasks')
    .update({ total_completions: (task.total_completions || 0) + 1 })
    .eq('id', taskId)

  const newBalance = (profile?.spy_balance || 0) + reward
  await supabase
    .from('profiles')
    .update({ spy_balance: newBalance })
    .eq('id', user.id)

  return NextResponse.json({ success: true, reward })
}
