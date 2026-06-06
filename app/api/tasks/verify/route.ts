import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { completionId, verified } = await request.json()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: completion } = await supabase
    .from('completed_tasks')
    .select('*, tasks(*)')
    .eq('id', completionId)
    .single()

  if (!completion) {
    return NextResponse.json({ error: 'Completion not found' }, { status: 404 })
  }

  const newStatus = verified ? 'verified' : 'rejected'

  await supabase
    .from('completed_tasks')
    .update({ status: newStatus, verified_at: new Date().toISOString() })
    .eq('id', completionId)

  if (!verified && completion.status === 'pending') {
    // Refund? No reward was given yet
  }

  return NextResponse.json({ success: true })
}
