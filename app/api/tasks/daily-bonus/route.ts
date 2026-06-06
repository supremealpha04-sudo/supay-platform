import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('daily_bonus_claims')
    .select('id')
    .eq('user_id', user.id)
    .eq('claimed_date', today)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Already claimed today' }, { status: 400 })
  }

  // Check if all tasks completed
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('is_active', true)

  const { data: completed } = await supabase
    .from('completed_tasks')
    .select('task_id')
    .eq('user_id', user.id)
    .eq('status', 'verified')
    .in('task_id', tasks?.map(t => t.id) || [])

  if ((completed?.length || 0) !== (tasks?.length || 0)) {
    return NextResponse.json({ error: 'Complete all tasks first' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, spy_balance, daily_bonus_streak')
    .eq('id', user.id)
    .single()

  const bonus = profile?.is_premium ? 6 : 3
  const newStreak = (profile?.daily_bonus_streak || 0) + 1

  await supabase
    .from('profiles')
    .update({
      spy_balance: (profile?.spy_balance || 0) + bonus,
      daily_bonus_streak: newStreak
    })
    .eq('id', user.id)

  await supabase.from('daily_bonus_claims').insert({
    user_id: user.id,
    bonus_spy: bonus,
    streak_day: newStreak,
    claimed_date: today
  })

  return NextResponse.json({ success: true, bonus })
}
