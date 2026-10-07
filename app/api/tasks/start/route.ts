// app/api/tasks/start/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const SESSION_DURATION_MINUTES = 30
const MIN_INTERACTION_SECONDS = 120

// ============================================
// SAFE DB HELPERS
// ============================================
async function safeQuery<T = any>(
  query: PromiseLike<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  try {
    const result = await query
    return result
  } catch (error) {
    console.warn('Query failed:', error)
    return { data: null, error }
  }
}

async function safeInsert(supabase: any, table: string, data: any) {
  try {
    const result = await supabase.from(table).insert(data)
    return result
  } catch (error) {
    console.warn(`Insert failed on ${table}:`, error)
    return { data: null, error }
  }
}

// ============================================
// SESSION TOKEN GENERATOR
// ============================================
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

// ============================================
// MAIN HANDLER
// ============================================
export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // 1. AUTH CHECK
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. PARSE BODY
    const body = await request.json()
    const { taskId, taskData } = body

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // 3. CHECK IF ALREADY COMPLETED (Anti-Duplicate)
    const { data: existingCompletion } = await safeQuery(
      supabase
        .from('completed_tasks')
        .select('id, verified_at, expires_at')
        .eq('user_id', user.id)
        .eq('task_id', taskId)
        .maybeSingle()
    )

    if (existingCompletion) {
      // Check if it's still within the 72-hour window
      const expiresAt = existingCompletion.expires_at
        ? new Date(existingCompletion.expires_at).getTime()
        : Date.now() + 72 * 60 * 60 * 1000

      if (Date.now() < expiresAt) {
        return NextResponse.json(
          { error: 'You already completed this task recently' },
          { status: 400 }
        )
      }
    }

    // 4. CHECK FOR ACTIVE SESSION
    const { data: activeSession } = await safeQuery(
      supabase
        .from('task_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_id', taskId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .maybeSingle()
    )

    if (activeSession) {
      // Return existing session
      return NextResponse.json({
        success: true,
        sessionToken: activeSession.session_token,
        expiresAt: activeSession.expires_at,
        minDurationSeconds: activeSession.min_duration_seconds || MIN_INTERACTION_SECONDS,
        maxWindowMinutes: SESSION_DURATION_MINUTES,
        existing: true,
        message: 'Resuming existing session',
      })
    }

    // 5. VERIFY TASK EXISTS (for DB tasks)
    // Social tasks won't exist in DB - handle gracefully
    let taskRecord = null
    const { data: dbTask } = await safeQuery(
      supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('is_active', true)
        .maybeSingle()
    )

    if (dbTask) {
      taskRecord = dbTask
    } else if (!taskData) {
      // Not in DB and no taskData provided from client
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // 6. GENERATE SESSION TOKEN
    const sessionToken = generateSessionToken(user.id, taskId)
    const expiresAt = new Date(
      Date.now() + SESSION_DURATION_MINUTES * 60 * 1000
    ).toISOString()

    // 7. INSERT SESSION RECORD
    const { error: insertError } = await safeQuery(
      supabase
        .from('task_sessions')
        .insert({
          user_id: user.id,
          task_id: taskId,
          session_token: sessionToken,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt,
          min_duration_seconds: MIN_INTERACTION_SECONDS,
          task_data: taskData || taskRecord || {},
        })
    )

    if (insertError) {
      console.error('Session insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to start session' },
        { status: 500 }
      )
    }

    // 8. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      sessionToken,
      expiresAt,
      minDurationSeconds: MIN_INTERACTION_SECONDS,
      maxWindowMinutes: SESSION_DURATION_MINUTES,
      task: taskRecord || taskData || null,
      message: 'Session started',
    })

  } catch (error) {
    console.error('Task start error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
