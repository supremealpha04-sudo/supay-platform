// app/api/tasks/start/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Generate signed task session token
function generateSessionToken(userId: string, taskId: string): string {
  const payload = {
    userId,
    taskId,
    startedAt: Date.now(),
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
    nonce: crypto.randomBytes(16).toString('hex'),
  }
  const secret = process.env.TASK_SESSION_SECRET || 'default-secret'
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64')
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { taskId } = await request.json()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify task exists and is active
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('is_active', true)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if already completed
    const { data: existing } = await supabase
      .from('completed_tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Task already completed' }, { status: 400 })
    }

    // Check if there's an active session (prevent multiple concurrent sessions)
    const { data: activeSession } = await supabase
      .from('task_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .maybeSingle()

    if (activeSession) {
      // Return existing session token
      return NextResponse.json({
        success: true,
        sessionToken: activeSession.session_token,
        expiresAt: activeSession.expires_at,
        minDurationSeconds: task.min_duration_seconds || 120, // Default 2 min
        maxWindowMinutes: 30,
        existing: true,
      })
    }

    // Generate new session
    const sessionToken = generateSessionToken(user.id, taskId)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase
      .from('task_sessions')
      .insert({
        user_id: user.id,
        task_id: taskId,
        session_token: sessionToken,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
        min_duration_seconds: task.min_duration_seconds || 120,
      })

    if (insertError) {
      console.error('Session insert error:', insertError)
      return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sessionToken,
      expiresAt,
      minDurationSeconds: task.min_duration_seconds || 120,
      maxWindowMinutes: 30,
      task: {
        id: task.id,
        title: task.title,
        url: task.url,
        taskType: task.task_type,
        rewardSpy: task.reward_spy,
      },
    })
  } catch (error) {
    console.error('Task start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
