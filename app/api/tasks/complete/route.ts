// app/api/tasks/complete/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const MIN_INTERACTION_SECONDS = 120
const CLEANUP_HOURS = 72

interface VerificationSignals {
  sessionToken: string
  actualDuration: number
  userAgent: string
  screenResolution: string
  timezone: string
  language: string
  platform: string
  hardwareConcurrency: number
  deviceMemory: number
  mouseMovements: number
  keystrokes: number
  scrollEvents: number
  clicks: number
  tabSwitches: number
  windowBlurs: number
  copyAttempts: number
  isHeadless: boolean
  isDevToolsOpen: boolean
  hasAdBlocker: boolean
  isPrivateMode: boolean
  isVirtualMachine: boolean
  isVPN: boolean
  isProxy: boolean
  isTor: boolean
  isDatacenter: boolean
  canvasFingerprint: string
  clickedUrl: boolean
  returnedToApp: boolean
  fraudScore: number
  timestamp: number
}

function verifySessionToken(token: string, userId: string, taskId: string): {
  valid: boolean
  payload?: any
  error?: string
} {
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const { payload, signature } = JSON.parse(decoded)

    const secret = process.env.TASK_SESSION_SECRET || 'supay-task-secret-change-me'
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' }
    }
    if (payload.userId !== userId || payload.taskId !== taskId) {
      return { valid: false, error: 'Session mismatch' }
    }
    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Session expired' }
    }

    return { valid: true, payload }
  } catch {
    return { valid: false, error: 'Malformed token' }
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { taskId, signals, taskData } = await request.json() as {
      taskId: string
      signals: VerificationSignals
      taskData?: any
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. VERIFY SESSION TOKEN
    const sessionCheck = verifySessionToken(signals.sessionToken, user.id, taskId)
    if (!sessionCheck.valid) {
      return NextResponse.json(
        { error: sessionCheck.error || 'Invalid session' },
        { status: 400 }
      )
    }

    // 2. VERIFY MINIMUM DURATION
    if (signals.actualDuration < MIN_INTERACTION_SECONDS) {
      return NextResponse.json(
        { 
          error: `You must spend at least ${MIN_INTERACTION_SECONDS / 60} minutes on this task`,
          details: `You spent ${Math.round(signals.actualDuration)}s`
        },
        { status: 400 }
      )
    }

    // 3. VERIFY USER CLICKED URL
    if (!signals.clickedUrl) {
      return NextResponse.json(
        { error: 'You must click the task link first' },
        { status: 400 }
      )
    }

    // 4. VERIFY USER RETURNED
    if (!signals.returnedToApp) {
      return NextResponse.json(
        { error: 'Please return to the app to verify' },
        { status: 400 }
      )
    }

    // 5. ANTI-CHEAT CHECKS
    const fraudScore = signals.fraudScore || 0

    if (fraudScore >= 60) {
      await supabase.from('fraud_logs').insert({
        user_id: user.id,
        task_id: taskId,
        fraud_score: fraudScore,
        signals,
        action: 'blocked',
        created_at: new Date().toISOString(),
      }).then(() => {}).catch(() => {})

      return NextResponse.json(
        { error: 'Suspicious activity detected. Task rejected.' },
        { status: 400 }
      )
    }

    // Behavioral checks
    const behavioralChecks = {
      hasMouseMovement: signals.mouseMovements >= 10,
      hasScrolls: signals.scrollEvents >= 3,
      hasClicks: signals.clicks >= 1,
      okTabSwitches: signals.tabSwitches <= 5,
      okBlurs: signals.windowBlurs <= 8,
      noCopy: signals.copyAttempts === 0,
    }

    const failedChecks = Object.entries(behavioralChecks)
      .filter(([_, passed]) => !passed)
      .map(([name]) => name)

    if (failedChecks.length >= 3) {
      await supabase.from('fraud_logs').insert({
        user_id: user.id,
        task_id: taskId,
        fraud_score: Math.max(fraudScore, 45),
        signals,
        action: 'blocked',
        reason: `Failed: ${failedChecks.join(', ')}`,
        created_at: new Date().toISOString(),
      }).then(() => {}).catch(() => {})

      return NextResponse.json(
        { error: 'Task verification failed. Please try again.' },
        { status: 400 }
      )
    }

    // 6. CHECK IF ALREADY COMPLETED
    const { data: existing } = await supabase
      .from('completed_tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Task already completed' },
        { status: 400 }
      )
    }

    // 7. GET TASK DETAILS
    let taskReward = 10 // Default fallback
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
      // Social task from client
      taskReward = taskData.reward_spy || 10
      taskTitle = taskData.title || 'Social Task'
    }

    // 8. GET PROFILE
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, spy_balance, earned_spy, trust_score')
      .eq('id', user.id)
      .single()

    // 9. CALCULATE REWARD
    const multiplier = profile?.is_premium ? 2 : 1
    const trustScore = profile?.trust_score ?? 100
    const trustModifier = Math.max(0.5, trustScore / 100)
    const baseReward = taskReward * multiplier
    const reward = Math.round(baseReward * trustModifier * 100) / 100

    // 10. INSERT COMPLETION
    const expiresAt = new Date(Date.now() + CLEANUP_HOURS * 60 * 60 * 1000).toISOString()

    const { data: completion, error: insertError } = await supabase
      .from('completed_tasks')
      .insert({
        user_id: user.id,
        task_id: taskId,
        reward_spy: reward,
        status: 'verified',
        verified_at: new Date().toISOString(),
        expires_at: expiresAt,
        fraud_score: fraudScore,
        signals,
        trust_modifier: trustModifier,
        session_token: signals.sessionToken,
        task_title: taskTitle,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to record completion' },
        { status: 500 }
      )
    }

    // 11. UPDATE TASK COUNTER (if exists in DB)
    if (task) {
      await supabase
        .from('tasks')
        .update({ total_completions: (task.total_completions || 0) + 1 })
        .eq('id', taskId)
    }

    // 12. CREDIT BALANCE
    const newBalance = (profile?.spy_balance || 0) + reward
    const newEarned = (profile?.earned_spy || 0) + reward

    await supabase
      .from('profiles')
      .update({
        spy_balance: newBalance,
        earned_spy: newEarned,
      })
      .eq('id', user.id)

    // 13. UPDATE TRUST SCORE
    const newTrustScore = Math.min(100, trustScore + 1)
    await supabase
      .from('profiles')
      .update({ trust_score: newTrustScore })
      .eq('id', user.id)

    // 14. MARK SESSION COMPLETE
    await supabase
      .from('task_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('session_token', signals.sessionToken)

    // 15. LOG TRANSACTION
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'task_complete',
      amount_spy: reward,
      balance_after: newBalance,
      description: `Completed: ${taskTitle}`,
      metadata: {
        task_id: taskId,
        fraud_score: fraudScore,
        multiplier,
        trust_modifier: trustModifier,
      },
      created_at: new Date().toISOString(),
    }).then(() => {}).catch(() => {})

    // 16. RETURN
    return NextResponse.json({
      success: true,
      reward,
      newBalance,
      completionId: completion.id,
      expiresAt,
      message: `+${reward} SPY earned!`,
    })

  } catch (error) {
    console.error('Task completion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
