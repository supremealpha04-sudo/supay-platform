// app/api/tasks/start/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const SESSION_DURATION_MINUTES = 30
const MIN_INTERACTION_SECONDS = 120

function generateSessionToken(userId: string, taskId: string): string {
  const payload = {
    userId,
    taskId,
    startedAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_MINUTES * 60 * 1000,
    nonce: crypto.randomBytes(16).toString('hex'),
  }
  const secret = process.env.TASK_SESSION_SECRET || 'supay-task-secret-change-me'
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
    const { taskId, taskData } = await request.json()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already completed (both tables for compatibility)
    const { data: existingCompletion } = await supabase
      .from('completed_tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .maybeSingle()

    if (existingCompletion) {
      return NextResponse.json(
        { error: 'You already completed this task' },
        { status: 400 }
      )
    }

    // Check for active session
    const { data: activeSession } = await supabase
      .from('task_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .maybeSingle()

    if (activeSession) {
      return NextResponse.json({
        success: true,
        sessionToken: activeSession.session_token,
        expiresAt: activeSession.expires_at,
        minDurationSeconds: activeSession.min_duration_seconds,
        maxWindowMinutes: SESSION_DURATION_MINUTES,
        existing: true,
      })
    }

    // Create new session
    const sessionToken = generateSessionToken(user.id, taskId)
    const expiresAt = new Date(
      Date.now() + SESSION_DURATION_MINUTES * 60 * 1000
    ).toISOString()

    const { error: insertError } = await supabase
      .from('task_sessions')
      .insert({
        user_id: user.id,
        task_id: taskId,
        session_token: sessionToken,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
        min_duration_seconds: MIN_INTERACTION_SECONDS,
        task_data: taskData || {},
      })

    if (insertError) {
      console.error('Session insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to start session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sessionToken,
      expiresAt,
      minDurationSeconds: MIN_INTERACTION_SECONDS,
      maxWindowMinutes: SESSION_DURATION_MINUTES,
    })
  } catch (error) {
    console.error('Task start error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
