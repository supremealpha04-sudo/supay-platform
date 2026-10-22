// app/dashboard/tasks/page.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  ArrowLeft, CheckCircle, Clock, DollarSign, Filter,
  Search, Star, Zap, Globe, Smartphone, Share2,
  Video, FileText, ChevronRight, Loader2, ExternalLink,
  Play, BarChart3, TrendingUp, Users, Instagram, Twitter,
  Linkedin, Youtube, Facebook, Award, Gift, Sparkles,
  AlertCircle, RefreshCw, Check, X, ShieldAlert,
  ShieldCheck, Timer, Hourglass
} from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
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
  task_url: string
  task_type: 'link' | 'survey' | 'video' | 'install' | 'social_follow'
  required_time_seconds: number
  max_completions: number
  is_active: boolean
  created_at: string
  expires_at?: string
  social_platform?: 'whatsapp' | 'tiktok' | 'instagram' | 'twitter' | 'youtube' | 'facebook'
  social_username?: string
}

interface CompletedTask {
  id: string
  task_id: string
  reward_spy: number
  status: string
  verified_at: string
  expires_at: string
  task_title?: string
}

interface ActiveSession {
  sessionToken: string
  expiresAt: string
  minDurationSeconds: number
  maxWindowMinutes: number
  task: Task
}

interface TaskSignals {
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
  sessionToken?: string
}

// ============================================
// CONSTANTS
// ============================================
const SOCIAL_TASKS: Task[] = [
  {
    id: 'social-whatsapp',
    title: 'Join SupremeAmer WhatsApp Channel',
    description: 'Follow our WhatsApp channel for exclusive updates and earning tips',
    reward_spy: 10,
    task_url: 'https://whatsapp.com/channel/0029Vb61UIaId7nVZcvJwt1s',
    task_type: 'social_follow',
    required_time_seconds: 30,
    max_completions: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    social_platform: 'whatsapp',
    social_username: 'SupremeAmer'
  },
  {
    id: 'social-tiktok',
    title: 'Follow SupremeAlpha on TikTok',
    description: 'Follow our TikTok account for daily crypto tips and rewards',
    reward_spy: 15,
    task_url: 'https://vm.tiktok.com/ZS9M9d1oKtaHF-TQSE6/',
    task_type: 'social_follow',
    required_time_seconds: 30,
    max_completions: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    social_platform: 'tiktok',
    social_username: 'SupremeAlpha'
  },
  {
    id: 'social-instagram',
    title: 'Follow SupremeAmer on Instagram',
    description: 'Follow our Instagram for exclusive content and giveaways',
    reward_spy: 12,
    task_url: 'https://instagram.com/supremeamer',
    task_type: 'social_follow',
    required_time_seconds: 30,
    max_completions: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    social_platform: 'instagram',
    social_username: '@supremeamer'
  }
]

const typeIcons: Record<string, any> = {
  link: Globe,
  survey: FileText,
  video: Video,
  install: Smartphone,
  social_follow: Users
}

const typeColors: Record<string, string> = {
  link: 'blue',
  survey: 'purple',
  video: 'red',
  install: 'green',
  social_follow: 'pink'
}

const socialIcons: Record<string, any> = {
  whatsapp: Share2,
  tiktok: Video,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  facebook: Facebook
}

const socialColors: Record<string, string> = {
  whatsapp: '#25D366',
  tiktok: '#000000',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  youtube: '#FF0000',
  facebook: '#1877F2'
}

// ============================================
// ANTI-CHEAT SERVICE
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
  private listeners: (() => void)[] = []

  startTracking() {
    this.mouseMoves = 0
    this.keystrokes = 0
    this.scrolls = 0
    this.clicks = 0
    this.tabSwitches = 0
    this.windowBlurs = 0
    this.copyAttempts = 0
    this.startTime = Date.now()
    this.listeners = []

    const mouseHandler = () => { this.mouseMoves++ }
    document.addEventListener('mousemove', mouseHandler)
    this.listeners.push(() => document.removeEventListener('mousemove', mouseHandler))

    const keyHandler = () => { this.keystrokes++ }
    document.addEventListener('keydown', keyHandler)
    this.listeners.push(() => document.removeEventListener('keydown', keyHandler))

    const scrollHandler = () => { this.scrolls++ }
    document.addEventListener('scroll', scrollHandler, { passive: true })
    this.listeners.push(() => document.removeEventListener('scroll', scrollHandler))

    const clickHandler = () => { this.clicks++ }
    document.addEventListener('click', clickHandler)
    this.listeners.push(() => document.removeEventListener('click', clickHandler))

    const visibilityHandler = () => {
      if (document.hidden) this.tabSwitches++
    }
    document.addEventListener('visibilitychange', visibilityHandler)
    this.listeners.push(() => document.removeEventListener('visibilitychange', visibilityHandler))

    const blurHandler = () => { this.windowBlurs++ }
    window.addEventListener('blur', blurHandler)
    this.listeners.push(() => window.removeEventListener('blur', blurHandler))

    const copyHandler = () => { this.copyAttempts++ }
    document.addEventListener('copy', copyHandler)
    this.listeners.push(() => document.removeEventListener('copy', copyHandler))
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

  async detectAdBlocker(): Promise<boolean> {
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
      ctx.fillText('Supay Anti-Cheat', 2, 15)
      return canvas.toDataURL().slice(-50)
    } catch {
      return 'blocked'
    }
  }

  async getSignals(
    expectedDuration: number,
    clickedUrl: boolean,
    returnedToApp: boolean
  ): Promise<TaskSignals> {
    const actualDuration = (Date.now() - this.startTime) / 1000
    const isHeadless = this.detectHeadless()
    const isDevToolsOpen = this.detectDevTools()
    const hasAdBlocker = await this.detectAdBlocker()
    const vpnInfo = await this.detectVPN()
    const canvasFingerprint = await this.getCanvasFingerprint()

    let fraudScore = 0
    if (isHeadless) fraudScore += 40
    if (isDevToolsOpen) fraudScore += 25
    if (hasAdBlocker) fraudScore += 15
    if (vpnInfo.vpn) fraudScore += 20
    if (vpnInfo.proxy) fraudScore += 20
    if (vpnInfo.tor) fraudScore += 30
    if (vpnInfo.datacenter) fraudScore += 15
    if (this.mouseMoves < 10) fraudScore += 15
    if (this.scrolls < 3) fraudScore += 10
    if (this.clicks < 1) fraudScore += 10
    if (this.tabSwitches > 3) fraudScore += 15
    if (this.windowBlurs > 5) fraudScore += 10
    if (this.copyAttempts > 0) fraudScore += 20

    return {
      actualDuration,
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
      isPrivateMode: false,
      isVirtualMachine: false,
      isVPN: vpnInfo.vpn,
      isProxy: vpnInfo.proxy,
      isTor: vpnInfo.tor,
      isDatacenter: vpnInfo.datacenter,
      canvasFingerprint,
      clickedUrl,
      returnedToApp,
      fraudScore: Math.min(100, fraudScore),
      timestamp: Date.now(),
    }
  }
}

const antiCheat = new AntiCheatService()

// ============================================
// MAIN COMPONENT
// ============================================
export default function TasksPage() {
  const { profile, user, refreshProfile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [userTasks, setUserTasks] = useState<CompletedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeType, setActiveType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [taskTimer, setTaskTimer] = useState(0)
  const [sessionTimer, setSessionTimer] = useState(0)
  const [clickedUrl, setClickedUrl] = useState(false)
  const [returnedToApp, setReturnedToApp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [selectedSocialTask, setSelectedSocialTask] = useState<Task | null>(null)
  const [isCompletingSocial, setIsCompletingSocial] = useState(false)
  const [stats, setStats] = useState({ available: 0, completed: 0, totalEarned: 0 })
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const taskTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ===== DATA FETCHING =====
  const fetchTasks = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('reward_spy', { ascending: false })

      const now = new Date().toISOString()
      const { data: completedData } = await supabase
        .from('completed_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'verified')
        .or(`expires_at.is.null,expires_at.gt.${now}`)

      let allTasks: Task[] = []
      if (tasksData) allTasks = [...tasksData]

      const existingSocialIds = new Set(allTasks.map(t => t.id))
      SOCIAL_TASKS.forEach(st => {
        if (!existingSocialIds.has(st.id)) allTasks.push(st)
      })

      setTasks(allTasks)
      setUserTasks(completedData || [])

      const completed = (completedData || []).length
      const totalEarned = (completedData || []).reduce(
        (sum, c) => sum + (c.reward_spy || 0),
        0
      )

      setStats({
        available: Math.max(0, allTasks.length - completed),
        completed,
        totalEarned,
      })
    } catch (e) {
      console.error('Error fetching tasks:', e)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) fetchTasks()
  }, [user, fetchTasks])

  // ===== HELPERS =====
  const getTaskStatus = useCallback((taskId: string) => {
    const completed = userTasks.find(ct => ct.task_id === taskId)
    if (completed) return 'completed'
    if (activeSession?.task.id === taskId) return 'active'
    return 'available'
  }, [userTasks, activeSession])

  const getSocialIcon = useCallback((platform?: string) => {
    if (!platform) return Share2
    return socialIcons[platform] || Share2
  }, [])

  const getSocialColor = useCallback((platform?: string) => {
    if (!platform) return '#60a5fa'
    return socialColors[platform] || '#60a5fa'
  }, [])

  const formatTime = useCallback((seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }, [])

  const formatCountdown = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  const getHoursUntilExpiry = useCallback((expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expiring'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return `${hours}h left`
  }, [])

  // ===== CANCEL SESSION =====
  const cancelSession = useCallback((showToast = true) => {
    antiCheat.stopTracking()
    if (taskTimerRef.current) clearInterval(taskTimerRef.current)
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
    setActiveSession(null)
    setTaskTimer(0)
    setSessionTimer(0)
    setClickedUrl(false)
    setReturnedToApp(false)
    setShowCancelConfirm(false)
    if (showToast) toast('Task cancelled', { icon: '⚠️' })
  }, [])

  // ===== START TASK =====
  const startTask = useCallback(async (task: Task) => {
    if (!user?.id) return

    if (task.task_type === 'social_follow') {
      setSelectedSocialTask(task)
      return
    }

    try {
      const response = await fetch('/api/tasks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, taskData: task }),
      })

      const data = await response.json()
      if (!data.success) {
        toast.error(data.error || 'Failed to start task')
        return
      }

      antiCheat.startTracking()

      setActiveSession({
        sessionToken: data.sessionToken,
        expiresAt: data.expiresAt,
        minDurationSeconds: data.minDurationSeconds,
        maxWindowMinutes: data.maxWindowMinutes,
        task,
      })

      setTaskTimer(data.minDurationSeconds)
      setSessionTimer(data.maxWindowMinutes * 60)
      setClickedUrl(false)
      setReturnedToApp(false)

      toast.success('Task started! Click the link to open.')

      if (taskTimerRef.current) clearInterval(taskTimerRef.current)
      taskTimerRef.current = setInterval(() => {
        setTaskTimer(prev => {
          if (prev <= 1) {
            if (taskTimerRef.current) clearInterval(taskTimerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
      sessionTimerRef.current = setInterval(() => {
        setSessionTimer(prev => {
          if (prev <= 1) {
            if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
            cancelSession()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (e) {
      console.error('Error starting task:', e)
      toast.error('Failed to start task')
    }
  }, [user?.id, cancelSession])

  // ===== CLICK TASK URL =====
  const handleClickTaskUrl = useCallback(() => {
    if (!activeSession) return
    window.open(activeSession.task.task_url, '_blank', 'noopener,noreferrer')
    setClickedUrl(true)
    toast.success('Task opened! Return here after completing.')
  }, [activeSession])

  // ===== RETURN TO APP =====
  const handleReturnToApp = useCallback(() => {
    if (!clickedUrl) {
      toast.error('Please click the task link first')
      return
    }
    setReturnedToApp(true)
    toast.success('Ready to verify!')
  }, [clickedUrl])

  // ===== COMPLETE TASK =====
  const completeTask = useCallback(async () => {
    if (!activeSession || !user?.id) return

    if (!clickedUrl) {
      toast.error('Please click the task link first')
      return
    }
    if (!returnedToApp) {
      toast.error('Please confirm you returned to the app')
      return
    }
    if (taskTimer > 0) {
      toast.error(`Please wait ${formatCountdown(taskTimer)} more`)
      return
    }

    setIsVerifying(true)

    try {
      const baseSignals = await antiCheat.getSignals(
        activeSession.minDurationSeconds,
        clickedUrl,
        returnedToApp
      )
      const signals: TaskSignals = {
        ...baseSignals,
        sessionToken: activeSession.sessionToken,
      }

      if (signals.fraudScore >= 60) {
        toast.error('🚫 Suspicious activity detected')
        cancelSession()
        setIsVerifying(false)
        return
      }

      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: activeSession.task.id,
          signals,
          taskData: activeSession.task,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`✅ +${data.reward} SPY earned!`)

        setTasks(prev => prev.filter(t => t.id !== activeSession.task.id))

        setUserTasks(prev => [
          ...prev,
          {
            id: data.completionId,
            task_id: activeSession.task.id,
            reward_spy: data.reward,
            status: 'verified',
            verified_at: new Date().toISOString(),
            expires_at: data.expiresAt,
            task_title: activeSession.task.title,
          },
        ])

        await refreshProfile()
        cancelSession(false)
      } else {
        toast.error(data.error || 'Verification failed')
        if (data.error?.includes('already')) {
          setTasks(prev => prev.filter(t => t.id !== activeSession.task.id))
          fetchTasks()
        }
        cancelSession(false)
      }
    } catch (e) {
      console.error('Task completion error:', e)
      toast.error('Failed to verify task')
    } finally {
      setIsVerifying(false)
    }
  }, [activeSession, user?.id, clickedUrl, returnedToApp, taskTimer, formatCountdown, refreshProfile, fetchTasks, cancelSession])

  // ===== VERIFY SOCIAL TASK =====
  const verifySocialTask = useCallback(async () => {
    if (!selectedSocialTask || !user?.id) return

    setIsCompletingSocial(true)

    try {
      const baseSignals = await antiCheat.getSignals(30, true, true)

      const startRes = await fetch('/api/tasks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedSocialTask.id,
          taskData: selectedSocialTask,
        }),
      })

      const startData = await startRes.json()
      if (!startData.success) {
        toast.error(startData.error || 'Failed to start')
        setIsCompletingSocial(false)
        return
      }

      const signals: TaskSignals = {
        ...baseSignals,
        sessionToken: startData.sessionToken,
        actualDuration: 120,
      }

      const completeRes = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedSocialTask.id,
          signals,
          taskData: selectedSocialTask,
        }),
      })

      const data = await completeRes.json()

      if (data.success) {
        toast.success(`🎉 Follow verified! +${data.reward} SPY`)

        setTasks(prev => prev.filter(t => t.id !== selectedSocialTask.id))
        setUserTasks(prev => [
          ...prev,
          {
            id: data.completionId,
            task_id: selectedSocialTask.id,
            reward_spy: data.reward,
            status: 'verified',
            verified_at: new Date().toISOString(),
            expires_at: data.expiresAt,
            task_title: selectedSocialTask.title,
          },
        ])

        await refreshProfile()
        setSelectedSocialTask(null)
      } else {
        toast.error(data.error || 'Verification failed')
      }
    } catch (e) {
      console.error('Social verify error:', e)
      toast.error('Failed to verify follow')
    } finally {
      setIsCompletingSocial(false)
    }
  }, [selectedSocialTask, user?.id, refreshProfile])

  // ===== REFRESH =====
  const refreshTasks = useCallback(async () => {
    setRefreshing(true)
    await fetchTasks()
    toast.success('Tasks refreshed!')
  }, [fetchTasks])

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      if (taskTimerRef.current) clearInterval(taskTimerRef.current)
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
      antiCheat.stopTracking()
    }
  }, [])

  // ===== FILTERED TASKS =====
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesType = activeType === 'all' || task.task_type === activeType
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [tasks, activeType, searchQuery])

  // ===== RENDER =====
  return (
    <div className="tasks-page">
      {/* ============ ACTIVE SESSION OVERLAY ============ */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="session-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="session-modal"
            >
              <div className="session-header">
                <div>
                  <h3>Complete Task</h3>
                  <div className="session-timer">
                    <Hourglass size={14} />
                    <span>Session: {formatCountdown(sessionTimer)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isVerifying}
                  className="session-close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="session-body">
                <div className="session-task-icon">
                  <Zap size={28} />
                </div>
                <h2>{activeSession.task.title}</h2>
                <p className="session-task-desc">{activeSession.task.description}</p>

                <div className="session-steps">
                  <div className={`session-step ${clickedUrl ? 'done' : 'active'}`}>
                    <div className="step-num">
                      {clickedUrl ? <Check size={16} /> : '1'}
                    </div>
                    <div className="step-content">
                      <h4>Open Task</h4>
                      <p>Click to open the task link</p>
                      {activeSession.task.task_url && (
                        <button
                          onClick={handleClickTaskUrl}
                          disabled={clickedUrl}
                          className="step-btn"
                        >
                          <ExternalLink size={14} />
                          Open Task
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`session-step ${returnedToApp ? 'done' : clickedUrl ? 'active' : ''}`}>
                    <div className="step-num">
                      {returnedToApp ? <Check size={16} /> : '2'}
                    </div>
                    <div className="step-content">
                      <h4>Complete & Return</h4>
                      <p>Finish the task then come back</p>
                      {clickedUrl && !returnedToApp && (
                        <button onClick={handleReturnToApp} className="step-btn">
                          <Check size={14} />
                          I've Returned
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`session-step ${taskTimer === 0 && returnedToApp ? 'active' : ''}`}>
                    <div className="step-num">
                      {taskTimer === 0 && returnedToApp ? <Timer size={16} /> : '3'}
                    </div>
                    <div className="step-content">
                      <h4>Wait & Verify</h4>
                      <p>
                        {taskTimer > 0
                          ? `Wait ${formatCountdown(taskTimer)} before verifying`
                          : 'Ready to verify!'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="anticheat-badge">
                  <ShieldCheck size={16} />
                  <span>Anti-cheat protection active</span>
                </div>
              </div>

              <div className="session-footer">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isVerifying}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={completeTask}
                  disabled={taskTimer > 0 || !clickedUrl || !returnedToApp || isVerifying}
                  className="btn-verify"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Verify Task
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ CANCEL CONFIRM MODAL ============ */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="confirm-overlay"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="confirm-modal"
            >
              <ShieldAlert size={40} className="confirm-icon" />
              <h3>Cancel Task?</h3>
              <p>Your progress will be lost.</p>
              <div className="confirm-actions">
                <button onClick={() => setShowCancelConfirm(false)} className="btn-cancel">
                  Keep Going
                </button>
                <button onClick={() => cancelSession()} className="btn-danger">
                  Cancel Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ SOCIAL TASK MODAL ============ */}
      <AnimatePresence>
        {selectedSocialTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedSocialTask(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setSelectedSocialTask(null)}
              >
                <ArrowLeft size={20} />
              </button>

              <div
                className="modal-icon"
                style={{
                  background: `${getSocialColor(selectedSocialTask.social_platform)}20`,
                  color: getSocialColor(selectedSocialTask.social_platform),
                }}
              >
                {(() => {
                  const Icon = getSocialIcon(selectedSocialTask.social_platform)
                  return <Icon size={32} />
                })()}
              </div>

              <h2>Follow & Earn</h2>
              <p className="modal-desc">{selectedSocialTask.description}</p>

              <div className="modal-social-info">
                <div
                  className="social-platform-badge"
                  style={{
                    borderColor: getSocialColor(selectedSocialTask.social_platform),
                  }}
                >
                  {(() => {
                    const Icon = getSocialIcon(selectedSocialTask.social_platform)
                    return <Icon size={16} style={{ color: getSocialColor(selectedSocialTask.social_platform) }} />
                  })()}
                  <span style={{ color: getSocialColor(selectedSocialTask.social_platform) }}>
                    {selectedSocialTask.social_platform?.toUpperCase()}
                  </span>
                </div>
                <div className="social-username">{selectedSocialTask.social_username}</div>
              </div>

              <div className="modal-reward">
                <Zap size={18} />
                <span>+{selectedSocialTask.reward_spy} SPY</span>
              </div>

              <div className="modal-actions">
                <a
                  href={selectedSocialTask.task_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-follow-btn"
                  style={{ background: getSocialColor(selectedSocialTask.social_platform) }}
                >
                  <ExternalLink size={18} />
                  Follow Now
                </a>
                <button
                  className="modal-verify-btn"
                  onClick={verifySocialTask}
                  disabled={isCompletingSocial}
                >
                  {isCompletingSocial ? (
                    <Loader2 size={18} className="spin" />
                  ) : (
                    <>
                      <Check size={18} />
                      I Followed, Verify!
                    </>
                  )}
                </button>
              </div>

              <p className="modal-hint">
                ⚡ Follow the page, then click "I Verified" to claim your reward
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ MAIN PAGE ============ */}
      <div className="tasks-header">
        <div className="header-left">
          <Link href="/dashboard" className="back-link">
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
          <h1 className="page-title">Earn Tasks</h1>
          <p className="page-subtitle">Complete tasks and earn SPY instantly</p>
        </div>
        <div className="header-stats">
          <div className="header-stat">
            <div className="stat-icon-wrap blue">
              <Zap size={18} />
            </div>
            <div>
              <span className="stat-value">{stats.available}</span>
              <span className="stat-label">Available</span>
            </div>
          </div>
          <div className="header-stat">
            <div className="stat-icon-wrap green">
              <CheckCircle size={18} />
            </div>
            <div>
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
          <div className="header-stat">
            <div className="stat-icon-wrap purple">
              <TrendingUp size={18} />
            </div>
            <div>
              <span className="stat-value">{stats.totalEarned.toFixed(0)}</span>
              <span className="stat-label">SPY Earned</span>
            </div>
          </div>
        </div>
      </div>

      <div className="social-banner">
        <div className="banner-content">
          <Sparkles size={20} className="banner-icon" />
          <div>
            <h4>Follow & Earn SPY!</h4>
            <p>Quick rewards from our social channels</p>
          </div>
        </div>
        <div className="banner-social-icons">
          {SOCIAL_TASKS.map(task => {
            const Icon = getSocialIcon(task.social_platform)
            const color = getSocialColor(task.social_platform)
            const status = getTaskStatus(task.id)
            const isCompleted = status === 'completed'
            return (
              <div
                key={task.id}
                className={`banner-social-item ${isCompleted ? 'completed' : ''}`}
                style={{ borderColor: isCompleted ? '#4ade80' : color }}
                title={isCompleted ? 'Completed!' : task.title}
                onClick={() => !isCompleted && setSelectedSocialTask(task)}
              >
                <Icon size={18} style={{ color: isCompleted ? '#4ade80' : color }} />
                {isCompleted && <Check size={12} className="check-badge" />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="tasks-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <button
          className="refresh-btn"
          onClick={refreshTasks}
          disabled={refreshing}
        >
          <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
        </button>
      </div>

      <div className="type-filters">
        {[
          { id: 'all', label: 'All Tasks', icon: BarChart3 },
          { id: 'link', label: 'Link Visit', icon: Globe },
          { id: 'survey', label: 'Surveys', icon: FileText },
          { id: 'video', label: 'Videos', icon: Video },
          { id: 'install', label: 'App Installs', icon: Smartphone },
          { id: 'social_follow', label: 'Social Follow', icon: Users },
        ].map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              className={`type-pill ${activeType === t.id ? 'active' : ''}`}
              onClick={() => setActiveType(t.id)}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="tasks-loading">
          <div className="loading-spinner" />
          <p>Loading available tasks...</p>
        </div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map(task => {
            const status = getTaskStatus(task.id)
            const TypeIcon = typeIcons[task.task_type] || Zap
            const colorClass = typeColors[task.task_type] || 'blue'
            const isSocial = task.task_type === 'social_follow'
            const SocialIcon = isSocial ? getSocialIcon(task.social_platform) : null
            const socialColor = isSocial ? getSocialColor(task.social_platform) : null

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`task-card ${status}`}
              >
                <div className="task-card-top">
                  <div className={`task-type-icon ${colorClass}`}>
                    {isSocial && SocialIcon ? (
                      <SocialIcon size={22} style={{ color: socialColor || undefined }} />
                    ) : (
                      <TypeIcon size={22} />
                    )}
                  </div>
                  <div className="task-reward-badge">
                    <Zap size={14} />
                    +{task.reward_spy} SPY
                  </div>
                </div>

                <h3 className="task-title">{task.title}</h3>
                <p className="task-description">{task.description}</p>

                {isSocial && task.social_platform && (
                  <div
                    className="social-platform-tag"
                    style={{ borderColor: socialColor || undefined }}
                  >
                    <span style={{ color: socialColor || undefined }}>
                      Follow on {task.social_platform.toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="task-meta-row">
                  <span className={`task-type-tag ${colorClass}`}>
                    {task.task_type === 'social_follow' ? 'Social' : task.task_type}
                  </span>
                  <span className="task-time">
                    <Clock size={12} />
                    {formatTime(task.required_time_seconds)}
                  </span>
                  <span className="task-slots">
                    <Users size={12} />
                    {task.max_completions} slots
                  </span>
                </div>

                <div className="task-footer">
                  {status === 'completed' ? (
                    <button className="task-btn done" disabled>
                      <CheckCircle size={16} />
                      Completed
                    </button>
                  ) : status === 'active' ? (
                    <button className="task-btn verify" disabled>
                      <Hourglass size={16} />
                      In Progress
                    </button>
                  ) : (
                    <button
                      className={`task-btn start ${isSocial ? 'social' : ''}`}
                      onClick={() => startTask(task)}
                      style={
                        isSocial
                          ? {
                              background: socialColor || undefined,
                              borderColor: socialColor || undefined,
                            }
                          : undefined
                      }
                    >
                      {isSocial ? <Users size={16} /> : <ExternalLink size={16} />}
                      {isSocial ? 'Follow & Earn' : 'Start Task'}
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {filteredTasks.length === 0 && !loading && (
        <div className="empty-state">
          <Search size={48} className="empty-icon" />
          <h3>No tasks available</h3>
          <p>Check back later for new earning opportunities</p>
        </div>
      )}

      {userTasks.length > 0 && (
        <div className="completed-section">
          <h2>
            Recently Completed ({userTasks.length})
            <span className="auto-delete-note">Auto-deletes after 72 hours</span>
          </h2>
          <div className="completed-grid">
            {userTasks.slice(0, 6).map(ct => (
              <div key={ct.id} className="completed-card">
                <CheckCircle size={20} className="completed-check" />
                <div>
                  <h4>{ct.task_title || 'Task Completed'}</h4>
                  <p>+{ct.reward_spy} SPY</p>
                  <span className="expires-tag">
                    <Timer size={10} /> {getHoursUntilExpiry(ct.expires_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
