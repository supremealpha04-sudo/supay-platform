// app/api/tasks/complete/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

interface VerificationSignals {
  // Session verification
  sessionToken: string

  // Timing verification
  actualDuration: number
  timeSinceStart: number
  timeOnTaskPage: number
  timeOnTaskSite: number

  // Browser integrity
  userAgent: string
  screenResolution: string
  timezone: string
  language: string
  platform: string
  hardwareConcurrency: number
  deviceMemory: number

  // Behavioral
  mouseMovements: number
  keystrokes: number
  scrollEvents: number
  clicks: number
  tabSwitches: number
  windowBlurs: number
  copyAttempts: number

  // Environment
  isHeadless: boolean
  isDevToolsOpen: boolean
  hasAdBlocker: boolean
  isPrivateMode: boolean
  isVirtualMachine: boolean
  isEmulator: boolean

  // Network
  isVPN: boolean
  isProxy: boolean
  isTor: boolean
  isDatacenter: boolean

  // Fingerprint
  canvasFingerprint: string
  webglFingerprint: string

  // Misc
  fraudScore: number
  clickedUrl: boolean
  returnedToApp: boolean
  timestamp: number
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { taskId, signals, proofImage } = await request.json() as {
      taskId: string
      signals: VerificationSignals
      proofImage?: string
    }

    // ============================================
    // 1. AUTH CHECK
    // ============================================
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ============================================
    // 2. VERIFY SESSION TOKEN (SIGNED)
    // ============================================
    let sessionPayload: any
    try {
      const decoded = Buffer.from(signals.sessionToken, 'base64').toString()
      const { payload, signature } = JSON.parse(decoded)

      const secret = process.env.TASK_SESSION_SECRET || 'default-secret'
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex')

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: 'Invalid session signature' },
          { status: 400 }
        )
      }

      if (payload.userId !== user.id || payload.taskId !== taskId) {
        return NextResponse.json(
          { error: 'Session mismatch' },
          { status: 400 }
        )
      }

      sessionPayload = payload
    } catch {
      return NextResponse.json(
        { error: 'Malformed session token' },
        { status: 400 }
      )
    }

    // ============================================
    // 3. CHECK SESSION EXPIRY (30 MINUTES)
    // ============================================
    const timeSinceStart = (Date.now() - sessionPayload.startedAt) / 1000

    if (Date.now() > sessionPayload.expiresAt) {
      await supabase
        .from('task_sessions')
        .update({ status: 'expired' })
        .eq('session_token', signals.sessionToken)

      return NextResponse.json(
        { error: 'Session expired. Please start the task again.' },
        { status: 400 }
      )
    }

    // ============================================
    // 4. VERIFY MINIMUM DURATION (2 MINUTES)
    // ============================================
    const MIN_DURATION_SECONDS = 120 // 2 minutes
    const MIN_TIME_ON_SITE = 110     // 1m 50s minimum
    const MIN_TIME_ON_PAGE = 115     // 1m 55s minimum

    if (signals.actualDuration < MIN_DURATION_SECONDS) {
      return NextResponse.json(
        { 
          error: `You must spend at least ${MIN_DURATION_SECONDS / 60} minutes on this task`,
          details: `You spent only ${Math.round(signals.actualDuration)}s`
        },
        { status: 400 }
      )
    }

    if (signals.timeOnTaskSite < MIN_TIME_ON_SITE) {
      return NextResponse.json(
        { error: 'You did not spend enough time on the task site' },
        { status: 400 }
      )
    }

    if (signals.timeOnTaskPage < MIN_TIME_ON_PAGE) {
      return NextResponse.json(
        { error: 'You did not spend enough time on the task page' },
        { status: 400 }
      )
    }

    // ============================================
    // 5. VERIFY USER CLICKED THE URL
    // ============================================
    if (!signals.clickedUrl) {
      return NextResponse.json(
        { error: 'You must click the task link to proceed' },
        { status: 400 }
      )
    }

    // ============================================
    // 6. VERIFY USER RETURNED TO APP
    // ============================================
    if (!signals.returnedToApp) {
      return NextResponse.json(
        { error: 'Please return to the app to complete the task' },
        { status: 400 }
      )
    }

    // ============================================
    // 7. ANTI-CHEAT VERIFICATION
    // ============================================
    const fraudScore = signals.fraudScore || 0

    // Block if fraud score too high
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

    // Verify behavioral signals
    const behavioralChecks = {
      hasMouseMovement: signals.mouseMovements >= 10,
      hasScrolls: signals.scrollEvents >= 3,
      hasValidClicks: signals.clicks >= 1,
      noExcessiveTabSwitches: signals.tabSwitches <= 5,
      noExcessiveBlurs: signals.windowBlurs <= 8,
      noCopyAttempts: signals.copyAttempts === 0,
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
        reason: `Failed behavioral checks: ${failedChecks.join(', ')}`,
        created_at: new Date().toISOString(),
      }).then(() => {}).catch(() => {})

      return NextResponse.json(
        { error: 'Task verification failed. Please try again.' },
        { status: 400 }
      )
    }

    // ============================================
    // 8. CHECK IF ALREADY COMPLETED
    // ============================================
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

    // ============================================
    // 9. GET TASK AND PROFILE
    // ============================================
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, spy_balance, earned_spy, trust_score')
      .eq('id', user.id)
      .single()

    // ============================================
    // 10. CALCULATE REWARD (with trust modifier)
    // ============================================
    const multiplier = profile?.is_premium ? 2 : 1
    const trustScore = profile?.trust_score ?? 100
    const trustModifier = Math.max(0.5, trustScore / 100) // Min 50% reward
    const baseReward = task.reward_spy * multiplier
    const reward = Math.round(baseReward * trustModifier * 100) / 100

    // ============================================
    // 11. INSERT COMPLETION
    // ============================================
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72 hours

    const { data: completion, error: insertError } = await supabase
      .from('completed_tasks')
      .insert({
        user_id: user.id,
        task_id: taskId,
        reward_spy: reward,
        status: 'verified',
        verified_at: new Date().toISOString(),
        expires_at: expiresAt, // Auto-delete after 72 hours
        fraud_score: fraudScore,
        signals: signals,
        trust_modifier: trustModifier,
        session_token: signals.sessionToken,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to record completion' }, { status: 500 })
    }

    // ============================================
    // 12. UPDATE TASK COUNTER
    // ============================================
    await supabase
      .from('tasks')
      .update({ total_completions: (task.total_completions || 0) + 1 })
      .eq('id', taskId)

    // ============================================
    // 13. CREDIT USER BALANCE
    // ============================================
    const newBalance = (profile?.spy_balance || 0) + reward
    const newEarned = (profile?.earned_spy || 0) + reward

    await supabase
      .from('profiles')
      .update({
        spy_balance: newBalance,
        earned_spy: newEarned,
      })
      .eq('id', user.id)

    // ============================================
    // 14. UPDATE TRUST SCORE
    // ============================================
    const newTrustScore = Math.min(100, trustScore + 1)
    await supabase
      .from('profiles')
      .update({ trust_score: newTrustScore })
      .eq('id', user.id)

    // ============================================
    // 15. MARK SESSION COMPLETE
    // ============================================
    await supabase
      .from('task_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('session_token', signals.sessionToken)

    // ============================================
    // 16. LOG TRANSACTION
    // ============================================
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'task_complete',
      amount_spy: reward,
      balance_after: newBalance,
      description: `Completed: ${task.title}`,
      metadata: {
        task_id: taskId,
        fraud_score: fraudScore,
        multiplier,
        trust_modifier: trustModifier,
      },
      created_at: new Date().toISOString(),
    }).then(() => {}).catch(() => {})

    // ============================================
    // 17. RETURN SUCCESS
    // ============================================
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
