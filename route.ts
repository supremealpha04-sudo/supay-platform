import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient()
  
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '7')

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get deposits
  const { data: deposits } = await supabase
    .from('deposits')
    .select('amount_usd, created_at')
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())

  // Get users
  const { data: users } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', startDate.toISOString())

  // Get tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('task_type, total_completions')

  return NextResponse.json({
    deposits,
    users,
    tasks
  })
}