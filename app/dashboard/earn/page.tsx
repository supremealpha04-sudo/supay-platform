// app/dashboard/tasks/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  FaTasks, FaCoins, FaClock, FaCheckCircle, 
  FaTimes, FaExternalLinkAlt, FaSync,
  FaExclamationCircle, FaShieldAlt, FaStar,
  FaPlayCircle, FaMousePointer, FaUserPlus, 
  FaGlobe, FaHourglassHalf, FaTrash
} from 'react-icons/fa'
import Link from 'next/link'
import './tasks.css'

const supabase = createClient()

// ============================================
// TYPES
// ============================================
interface Task {
  id: string
  title: string
  description: string
  reward_spy: number
  task_type: 'video' | 'click' | 'social' | 'survey' | 'signup'
  url?: string
  min_duration_seconds: number
  daily_limit: number
  total_completions: number
  is_active: boolean
  created_at: string
}

interface CompletedTask {
  id: string
  task_id: string
  verified_at: string
  expires_at: string
  reward_spy: number
  status: string
}

interface ActiveSession {
  sessionToken: string
  expiresAt: string
  minDurationSeconds: number
  maxWindowMinutes: number
  task: {
    id: string
    title: string
    url?: string
    taskType: string
    rewardSpy: number
  }
}

// ============================================
// ANTI-CHEAT SERVICE - ULTRA
// ============================================
class AntiCheatService {
  private mouseMoves = 0
  private keystrokes = 0
  private scrolls = 0
  private clicks = 0
  private tabSwitches = 0
  private windowBlurs = 0
  private copyAttempts = 0
  private startTime = 0
  private pageVisibleStart = 0
  private listeners: (() => void)[] = []
  private onBlurReset: () => void

  constructor(onBlurReset: () => void) {
    this.onBlurReset = onBlurReset
  }

  startTracking() {
    this.mouseMoves = 0
    this.keystrokes = 0
    this.scrolls = 0
    this.clicks = 0
    this.tabSwitches = 0
    this.windowBlurs = 0
    this.copyAttempts = 0
    this.startTime = Date.now()
    this.pageVisibleStart = Date.now()
    this.listeners = []

    // Mouse movement
    const mouseHandler = () => { this.mouseMoves++ }
    document.addEventListener('mousemove', mouseHandler)
    this.listeners.push(() => document.removeEventListener('mousemove', mouseHandler))

    // Keyboard
    const keyHandler = () => { this.keystrokes++ }
    document.addEventListener('keydown', keyHandler)
    this.listeners.push(() => document.removeEventListener('keydown', keyHandler))

    // Scroll
    const scrollHandler = () => { this.scrolls++ }
    document.addEventListener('scroll', scrollHandler, { passive: true })
    this.listeners.push(() => document.removeEventListener('scroll', scrollHandler))

    // Clicks
    const clickHandler = () => { this.clicks++ }
    document.addEventListener('click', clickHandler)
    this.listeners.push(() => document.removeEventListener('click', clickHandler))

    // Tab visibility
    const visibilityHandler = () => {
      if (document.hidden) {
        this.tabSwitches++
      } else {
        this.pageVisibleStart = Date.now()
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)
    this.listeners.push(() => document.removeEventListener('visibilitychange', visibilityHandler))

    // Window blur
    const blurHandler = () => {
      this.windowBlurs++
      this.onBlurReset()
    }
    window.addEventListener('blur', blurHandler)
    this.listeners.push(() => window.removeEventListener('blur', blurHandler))

    // Copy attempt
    const copyHandler = (e: ClipboardEvent) => {
      this.copyAttempts++
    }
    document.addEventListener('copy', copyHandler)
    this.listeners.push(() => document.removeEventListener('copy', copyHandler))

    // Context menu (right-click)
    const contextHandler = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }
    document.addEventListener('contextmenu', contextHandler)
    this.listeners.push(() => document.removeEventListener('contextmenu', contextHandler))
  }

  stopTracking() {
    this.listeners.forEach(remove => remove())
    this.listeners = []
  }

  detectHeadless(): boolean {
    const checks = [
      navigator.webdriver === true,
      /HeadlessChrome/.test(navigator.userAgent),
      /Chrome\/\d+/.test(navigator.userAgent) && navigator.plugins.length === 0,
      window.outerWidth === 0 && window.outerHeight === 0,
      !navigator.mimeTypes || navigator.mimeTypes.length === 0,
      !!(window as any).Cypress,
      !!(window as any).__playwright,
      !!(window as any).callPhantom,
      !!(window as any)._phantom,
      !!(window as any).__nightmare,
    ]
    return checks.filter(Boolean).length >= 3
  }

  detectDevTools(): boolean {
    const threshold = 160
    return (window.outerWidth - window.innerWidth > threshold) ||
           (window.outerHeight - window.innerHeight > threshold)
  }

  detectAdBlocker(): Promise<boolean> {
    return new Promise((resolve) => {
      const testAd = document.createElement('div')
      testAd.className = 'adsbox pub_300x250 text-ad'
      testAd.style.cssText = 'position:absolute;left:-9999px;'
      document.body.appendChild(testAd)
      setTimeout(() => {
        const blocked = testAd.offsetHeight === 0
        document.body.removeChild(testAd)
        resolve(blocked)
      }, 100)
    })
  }

  detectPrivateMode(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        localStorage.setItem('test', '1')
        localStorage.removeItem('test')
        resolve(false)
      } catch {
        resolve(true)
      }
    })
  }

  detectVM(): boolean {
    return [
      /VMware|VirtualBox|Parallels|QEMU/.test(navigator.userAgent),
      navigator.hardwareConcurrency <= 2,
      (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4,
    ].filter(Boolean).length >= 2
  }

  async detectVPN(): Promise<{ vpn: boolean; proxy: boolean; tor: boolean; datacenter: boolean }> {
    try {
      const res = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(3000)
      })
      const data = await res.json()
      return {
        vpn: data.security?.vpn || false,
        proxy: data.security?.proxy || false,
        tor: data.security?.tor || false,
        datacenter: data.type === 'hosting' || data.type === 'business',
      }
    } catch {
      return { vpn: false, proxy: false, tor: false, datacenter: false }
    }
  }

  async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return 'unsupported'
      canvas.width = 200
      canvas.height = 50
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(0, 0, 200, 50)
      ctx.fillStyle = '#069'
      ctx.fillText('Supay Anti-Cheat ' + Date.now(), 2, 15)
      return canvas.toDataURL().slice(-50)
    } catch {
      return 'blocked'
    }
  }

  async getSignals(expectedDuration: number, clickedUrl: boolean, returnedToApp: boolean) {
    const actualDuration = (Date.now() - this.startTime) / 1000
    const playbackSpeed = expectedDuration / actualDuration
    const isHeadless = this.detectHeadless()
    const isDevToolsOpen = this.detectDevTools()
    const hasAdBlocker = await this.detectAdBlocker()
    const isPrivateMode = await this.detectPrivateMode()
    const isVM = this.detectVM()
    const vpnInfo = await this.detectVPN()
    const canvasFingerprint = await this.getCanvasFingerprint()

    // Calculate fraud score
    let fraudScore = 0
    if (isHeadless) fraudScore += 40
    if (isDevToolsOpen) fraudScore += 25
    if (hasAdBlocker) fraudScore += 15
    if (isPrivateMode) fraudScore += 10
    if (isVM) fraudScore += 15
    if (vpnInfo.vpn) fraudScore += 20
    if (vpnInfo.proxy) fraudScore += 20
    if (vpnInfo.tor) fraudScore += 30
    if (vpnInfo.datacenter) fraudScore += 15
    if (playbackSpeed > 1.5) fraudScore += 25
    if (this.mouseMoves < 10) fraudScore += 15
    if (this.scrolls < 3) fraudScore += 10
    if (this.clicks < 1) fraudScore += 10
    if (this.tabSwitches > 3) fraudScore += 15
    if (this.windowBlurs > 5) fraudScore += 10
    if (this.copyAttempts > 0) fraudScore += 20

    return {
      actualDuration,
      timeSinceStart: actualDuration,
      timeOnTaskPage: actualDuration,
      timeOnTaskSite: actualDuration,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory || 0,
      mouseMovements: this.mouseMoves,
      keystrokes: this.keystrokes,
      scrollEvents: this.scrolls,
      clicks: this.clicks,
      tabSwitches: this.tabSwitches,
      windowBlurs: this.windowBlurs,
      copyAttempts: this.copyAttempts,
      isHeadless,
      isDevToolsOpen,
      hasAdBlocker,
      isPrivateMode,
      isVirtualMachine: isVM,
      isEmulator: false,
      isVPN: vpnInfo.vpn,
      isProxy: vpnInfo.proxy,
      isTor: vpnInfo.tor,
      isDatacenter: vpnInfo.datacenter,
      canvasFingerprint,
      webglFingerprint: 'n/a',
      expectedDuration,
      playbackSpeed,
      fraudScore: Math.min(100, fraudScore),
      clickedUrl,
      returnedToApp,
      timestamp: Date.now(),
    }
  }
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function TasksPage() {
  const { profile, user, refreshProfile } = useAuth()
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [taskTimer, setTaskTimer] = useState(0)
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  const [clickedUrl, setClickedUrl] = useState(false)
  const [returnedToApp, setReturnedToApp] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [sessionUser, setSessionUser] = useState<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const antiCheatRef = useRef<AntiCheatService | null>(null)

  // Initialize anti-cheat
  useEffect(() => {
    antiCheatRef.current = new AntiCheatService(() => {
      // Called when window blurs - reset returnedToApp
      setReturnedToApp(false)
    })
  }, [])

  // ===== SESSION CHECK =====
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) setSessionUser(session.user)
    }
    checkSession()
  }, [])

  // ===== FETCH TASKS =====
  const fetchTasks = useCallback(async () => {
    const userId = profile?.id || sessionUser?.id
    if (!userId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get all active tasks
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('reward_spy', { ascending: false })

      if (tasksError) throw tasksError

      // Get user's completed tasks (only non-expired)
      const now = new Date().toISOString()
      const { data: completions } = await supabase
        .from('completed_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'verified')
        .or(`expires_at.is.null,expires_at.gt.${now}`)

      const completedIds = new Set((completions || []).map(c => c.task_id))
      const available = (allTasks || []).filter(task => !completedIds.has(task.id))

      setAvailableTasks(available)
      setCompletedTasks(completions || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError('Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }, [profile, sessionUser])

  useEffect(() => {
    const userId = profile?.id || sessionUser?.id
    if (userId) fetchTasks()
  }, [profile, sessionUser, fetchTasks])

  // ===== START TASK =====
  const handleStartTask = async (task: Task) => {
    const userId = profile?.id || sessionUser?.id
    if (!userId) {
      toast.error('Please log in')
      return
    }

    if (completedTasks.some(c => c.task_id === task.id)) {
      toast.error('You already completed this task!')
      return
    }

    try {
      const response = await fetch('/api/tasks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.error || 'Failed to start task')
        return
      }

      // Start anti-cheat tracking
      antiCheatRef.current?.startTracking()

      setActiveSession({
        sessionToken: data.sessionToken,
        expiresAt: data.expiresAt,
        minDurationSeconds: data.minDurationSeconds,
        maxWindowMinutes: data.maxWindowMinutes,
        task: data.task,
      })

      setTaskTimer(data.minDurationSeconds)
      setSessionTimeLeft(data.maxWindowMinutes * 60)
      setClickedUrl(false)
      setReturnedToApp(false)

      toast.success('Task started! Click the link below to open it.')

      // Start countdown timers
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setTaskTimer(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
      sessionTimerRef.current = setInterval(() => {
        setSessionTimeLeft(prev => {
          if (prev <= 1) {
            if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
            handleCancelSession()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      console.error('Start task error:', err)
      toast.error('Failed to start task')
    }
  }

  // ===== CLICK TASK URL =====
  const handleClickTaskUrl = () => {
    if (!activeSession?.task.url) return
    window.open(activeSession.task.url, '_blank', 'noopener,noreferrer')
    setClickedUrl(true)
    toast.success('Task opened! Return here after completing.')
  }

  // ===== RETURN TO APP =====
  const handleReturnToApp = () => {
    if (!clickedUrl) {
      toast.error('Please click the task link first')
      return
    }
    setReturnedToApp(true)
    toast.success('Ready to verify!')
  }

  // ===== COMPLETE TASK =====
  const handleCompleteTask = async () => {
    if (!activeSession) return
    const userId = profile?.id || sessionUser?.id
    if (!userId) return

    if (!clickedUrl) {
      toast.error('Please click the task link first')
      return
    }

    if (!returnedToApp) {
      toast.error('Please confirm you returned to the app')
      return
    }

    if (taskTimer > 0) {
      toast.error(`Please wait ${taskTimer} more seconds`)
      return
    }

    setIsVerifying(true)

    try {
      const signals = await antiCheatRef.current?.getSignals(
        activeSession.minDurationSeconds,
        clickedUrl,
        returnedToApp
      )

      if (!signals) {
        toast.error('Failed to collect signals')
        setIsVerifying(false)
        return
      }

      signals.sessionToken = activeSession.sessionToken

      if (signals.fraudScore >= 60) {
        toast.error('🚫 Suspicious activity detected')
        console.warn('Fraud signals:', signals)
        handleCancelSession()
        setIsVerifying(false)
        return
      }

      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: activeSession.task.id,
          signals,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`✅ +${data.reward} SPY earned!`)

        // ✅ AUTO-REMOVE FROM AVAILABLE
        setAvailableTasks(prev => prev.filter(t => t.id !== activeSession.task.id))

        // ✅ ADD TO COMPLETED
        setCompletedTasks(prev => [...prev, {
          id: data.completionId,
          task_id: activeSession.task.id,
          verified_at: new Date().toISOString(),
          expires_at: data.expiresAt,
          reward_spy: data.reward,
          status: 'verified',
        }])

        await refreshProfile()
        handleCancelSession(false)
      } else {
        toast.error(data.error || 'Verification failed')
        if (data.error?.includes('already')) {
          setAvailableTasks(prev => prev.filter(t => t.id !== activeSession.task.id))
          fetchTasks()
        }
        handleCancelSession(false)
      }
    } catch (err) {
      console.error('Task completion error:', err)
      toast.error('Failed to verify task')
    } finally {
      setIsVerifying(false)
    }
  }

  // ===== CANCEL SESSION =====
  const handleCancelSession = (showToast = true) => {
    if (isVerifying) return
    antiCheatRef.current?.stopTracking()
    if (timerRef.current) clearInterval(timerRef.current)
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
    setActiveSession(null)
    setTaskTimer(0)
    setSessionTimeLeft(0)
    setClickedUrl(false)
    setReturnedToApp(false)
    setShowConfirmModal(false)
    if (showToast) toast('Task cancelled', { icon: '⚠️' })
  }

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
      antiCheatRef.current?.stopTracking()
    }
  }, [])

  // ===== HELPERS =====
  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'video': return FaPlayCircle
      case 'click': return FaMousePointer
      case 'social': return FaUserPlus
      case 'survey': return FaGlobe
      case 'signup': return FaUserPlus
      default: return FaTasks
    }
  }

  const getTaskColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-500'
      case 'click': return 'bg-blue-500'
      case 'social': return 'bg-purple-500'
      case 'survey': return 'bg-green-500'
      case 'signup': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getHoursUntilExpiry = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expiring...'
    return `${Math.floor(diff / (1000 * 60 * 60))}h left`
  }

  // ===== RENDER =====
  return (
    <div className="tasks-container">
      {/* ACTIVE SESSION OVERLAY */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="task-overlay"
          >
            <div className="task-modal">
              {/* Header with session timer */}
              <div className="task-modal-header">
                <div>
                  <h3>Complete Task</h3>
                  <p className="task-modal-session-timer">
                    <FaHourglassHalf /> Session: {formatTime(sessionTimeLeft)}
                  </p>
                </div>
                <button onClick={() => setShowConfirmModal(true)} disabled={isVerifying}>
                  <FaTimes />
                </button>
              </div>

              <div className="task-modal-body">
                <div className={`task-modal-icon ${getTaskColor(activeSession.task.taskType)}`}>
                  {(() => {
                    const Icon = getTaskIcon(activeSession.task.taskType)
                    return <Icon />
                  })()}
                </div>

                <h2>{activeSession.task.title}</h2>

                {/* Steps */}
                <div className="task-steps">
                  <div className={`task-step ${clickedUrl ? 'completed' : 'active'}`}>
                    <div className="task-step-number">
                      {clickedUrl ? <FaCheckCircle /> : '1'}
                    </div>
                    <div className="task-step-content">
                      <h4>Open Task</h4>
                      <p>Click the button below to open the task</p>
                      {activeSession.task.url && (
                        <button
                          onClick={handleClickTaskUrl}
                          className="task-step-btn"
                          disabled={clickedUrl}
                        >
                          <FaExternalLinkAlt /> Open Task
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`task-step ${returnedToApp ? 'completed' : clickedUrl ? 'active' : ''}`}>
                    <div className="task-step-number">
                      {returnedToApp ? <FaCheckCircle /> : '2'}
                    </div>
                    <div className="task-step-content">
                      <h4>Complete & Return</h4>
                      <p>Complete the task then come back</p>
                      {clickedUrl && !returnedToApp && (
                        <button
                          onClick={handleReturnToApp}
                          className="task-step-btn"
                        >
                          ✓ I've Returned
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`task-step ${taskTimer === 0 && returnedToApp ? 'active' : ''}`}>
                    <div className="task-step-number">3</div>
                    <div className="task-step-content">
                      <h4>Wait & Verify</h4>
                      <p>
                        {taskTimer > 0
                          ? `Wait ${formatTime(taskTimer)} before verifying`
                          : 'Ready to verify!'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Anti-cheat indicator */}
                <div className="task-verify-status">
                  <FaShieldAlt className="text-green-400" />
                  <span>Anti-cheat protection active</span>
                </div>
              </div>

              <div className="task-modal-footer">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="task-btn-cancel"
                  disabled={isVerifying}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteTask}
                  className="task-btn-complete"
                  disabled={taskTimer > 0 || !clickedUrl || !returnedToApp || isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <FaSync className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle /> Verify Task
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM CANCEL MODAL */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="task-confirm-overlay"
          >
            <div className="task-confirm-modal">
              <h3>Cancel Task?</h3>
              <p>Your progress will be lost. Are you sure?</p>
              <div className="task-confirm-actions">
                <button onClick={() => setShowConfirmModal(false)} className="task-btn-cancel">
                  Keep Going
                </button>
                <button onClick={() => handleCancelSession()} className="task-btn-danger">
                  Cancel Task
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="tasks-header">
        <h1><FaTasks className="text-accent-500" /> Tasks</h1>
        <p>Complete tasks to earn SPY rewards</p>
      </div>

      {/* Stats */}
      <div className="tasks-stats">
        <div className="tasks-stat-card">
          <FaTasks className="text-accent-500" />
          <div>
            <p className="tasks-stat-label">Available</p>
            <p className="tasks-stat-value">{availableTasks.length}</p>
          </div>
        </div>
        <div className="tasks-stat-card">
          <FaCheckCircle className="text-green-400" />
          <div>
            <p className="tasks-stat-label">Completed</p>
            <p className="tasks-stat-value">{completedTasks.length}</p>
          </div>
        </div>
        <div className="tasks-stat-card">
          <FaCoins className="text-yellow-400" />
          <div>
            <p className="tasks-stat-label">Total Earned</p>
            <p className="tasks-stat-value">
              {completedTasks.reduce((sum, t) => sum + (t.reward_spy || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="tasks-error">
          <FaExclamationCircle />
          <span>{error}</span>
          <button onClick={fetchTasks}>
            <FaSync /> Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="tasks-loading">
          <div className="spinner" />
          <p>Loading tasks...</p>
        </div>
      ) : (
        <>
          {/* Available Tasks */}
          <div className="tasks-section">
            <h2>Available Tasks ({availableTasks.length})</h2>
            {availableTasks.length === 0 ? (
              <div className="tasks-empty">
                <FaCheckCircle className="tasks-empty-icon" />
                <h3>All tasks completed! 🎉</h3>
                <p>New tasks will appear soon. Check back later!</p>
                <Link href="/dashboard/earn" className="tasks-empty-link">
                  Watch Ads Instead
                </Link>
              </div>
            ) : (
              <div className="tasks-grid">
                {availableTasks.map((task) => {
                  const Icon = getTaskIcon(task.task_type)
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="task-card"
                    >
                      <div className={`task-icon ${getTaskColor(task.task_type)}`}>
                        <Icon />
                      </div>
                      <div className="task-content">
                        <h3>{task.title}</h3>
                        <p>{task.description}</p>
                        <div className="task-meta">
                          <span className="task-reward">
                            <FaCoins /> +{task.reward_spy} SPY
                            {profile?.is_premium && (
                              <span className="task-premium-boost">2x</span>
                            )}
                          </span>
                          <span className="task-duration">
                            <FaClock /> {Math.floor((task.min_duration_seconds || 120) / 60)}min
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartTask(task)}
                        className="task-start-btn"
                      >
                        Start <FaExternalLinkAlt />
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Completed Tasks (Auto-deletes after 72h) */}
          {completedTasks.length > 0 && (
            <div className="tasks-section">
              <h2>
                Recently Completed ({completedTasks.length})
                <span className="tasks-section-note">
                  Auto-deletes after 72 hours
                </span>
              </h2>
              <div className="tasks-grid completed">
                {completedTasks.map((completion) => (
                  <div key={completion.id} className="task-card completed">
                    <div className="task-icon bg-green-500">
                      <FaCheckCircle />
                    </div>
                    <div className="task-content">
                      <h3>Task Completed</h3>
                      <p>Reward: <strong>+{completion.reward_spy} SPY</strong></p>
                      <div className="task-completed-meta">
                        <span className="task-completed-time">
                          {new Date(completion.verified_at).toLocaleDateString()}
                        </span>
                        {completion.expires_at && (
                          <span className="task-expires-in">
                            <FaTrash /> {getHoursUntilExpiry(completion.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
