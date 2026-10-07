// app/api/tasks/cleanup/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This should be called by a cron job every hour
export async function POST(request: Request) {
  try {
    // Optional: verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Delete completed tasks older than 72 hours
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('completed_tasks')
      .delete()
      .lt('verified_at', cutoff)
      .select('id')

    if (error) {
      console.error('Cleanup error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also clean up expired sessions
    await supabase
      .from('task_sessions')
      .delete()
      .lt('expires_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    return NextResponse.json({
      success: true,
      deleted: data?.length || 0,
      cutoff,
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
