import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())

  if (user) {
    const { data: completed } = await supabase
      .from('completed_tasks')
      .select('task_id')
      .eq('user_id', user.id)
      .eq('status', 'verified')

    const completedIds = new Set(completed?.map(c => c.task_id) || [])
    return NextResponse.json({ tasks, completed: Array.from(completedIds) })
  }

  return NextResponse.json({ tasks, completed: [] })
}
