// app/dashboard/tasks/complete/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  FaCheckCircle, FaTimesCircle, FaSpinner, FaArrowLeft, 
  FaExternalLinkAlt, FaShieldAlt, FaClock, FaMousePointer 
} from 'react-icons/fa'
import Link from 'next/link'

const supabase = createClient()

// ===== CONSTANTS =====
const MIN_INTERACTION_SECONDS = 120
const CHECK_INTERVAL_MS = 3000 // Check every 3 seconds
const MAX_CHECKS = 20 // Stop checking after 60 seconds (20 * 3s)

export default function CompleteTaskPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, refreshProfile } = useAuth()
  
  const taskId = searchParams.get('id')
  const [task, setTask] = useState<any>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'verifying' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [hasClicked, setHasClicked] = useState(false)
  const [timeLeft, setTimeLeft] = useState(MIN_INTERACTION_SECONDS)
  const [completionId, setCompletionId] = useState<string | null>(null)
  
  // Tracking refs
  const startTime = useRef<number>(Date.now())
  const checkCount = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const verifyIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Fetch Task Details
  useEffect(() => {
    if (!taskId) {
      setStatus('error')
      setErrorMessage('No task ID provided')
      return
    }

    const fetchTask = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single()

        if (error) throw error
        if (!data) throw new Error('Task not found')

        setTask(data)
        setStatus('ready')
      } catch (err: any) {
        setStatus('error')
        setErrorMessage(err.message || 'Failed to load task')
      }
    }

    fetchTask()
  }, [taskId])

  // 2. Timer Logic (Starts after user clicks the ad link)
  useEffect(() => {
    if (!hasClicked || status !== 'ready') return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [hasClicked, status])

  // 3. Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (verifyIntervalRef.current) clearInterval(verifyIntervalRef.current)
    }
  }, [])

  // 4. Handle "Open Task Link" Click
  const handleOpenTask = () => {
    if (!task?.url) {
      toast.error('Task link is missing')
      return
    }

    // Open link in new tab
    window.open(task.url, '_blank', 'noopener,noreferrer')
    
    setHasClicked(true)
    startTime.current = Date.now()
    
    toast.success('Task opened! Please complete it and return here.')
  }

  // 5. Handle "I Have Completed It" Click
  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in first')
      return
    }

    const actualDuration = (Date.now() - startTime.current) / 1000

    if (actualDuration < MIN_INTERACTION_SECONDS) {
      toast.error(`Please wait at least ${MIN_INTERACTION_SECONDS / 60} minutes`)
      return
    }

    setStatus('verifying')

    try {
      // Step A: Submit completion to the /complete API
      const completeRes = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          signals: {
            sessionToken: 'mock-token', // Replace with real token if you have one
            actualDuration,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency || 1,
            deviceMemory: (navigator as any).deviceMemory || 4,
            mouseMovements: 50, // Replace with real tracker
            keystrokes: 5,
            scrollEvents: 10,
            clicks: 2,
            tabSwitches: 0,
            windowBlurs: 0,
            copyAttempts: 0,
            isHeadless: false,
            isDevToolsOpen: false,
            hasAdBlocker: false,
            isPrivateMode: false,
            isVirtualMachine: false,
            isVPN: false,
            isProxy: false,
            isTor: false,
            isDatacenter: false,
            canvasFingerprint: 'mock',
            clickedUrl: hasClicked,
            returnedToApp: true,
            fraudScore: 0,
            timestamp: Date.now()
          },
          taskData: task
        })
      })

      const completeData = await completeRes.json()

      if (!completeRes.ok) {
        throw new Error(completeData.error || 'Failed to record completion')
      }

      setCompletionId(completeData.completionId)

      // Step B: Trigger Verification Check
      await verifyCompletion(completeData.completionId)

    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'Submission failed')
      toast.error(err.message || 'Submission failed')
    }
  }

  // 6. Verify Completion (with retries)
  const verifyCompletion = async (compId: string) => {
    checkCount.current = 0

    const checkStatus = async () => {
      try {
        checkCount.current++
        
        const res = await fetch('/api/tasks/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            completionId: compId,
            verified: true,
            actualDuration: (Date.now() - startTime.current) / 1000,
            clickedUrl: hasClicked,
            fraudScore: 0
          })
        })

        const data = await res.json()

        if (data.success && data.status === 'verified') {
          // Success!
          clearInterval(verifyIntervalRef.current!)
          setStatus('success')
          toast.success(`Task Verified! +${data.reward} SPY`)
          await refreshProfile()
          return
        }

        if (data.status === 'rejected') {
          clearInterval(verifyIntervalRef.current!)
          setStatus('error')
          setErrorMessage(data.error || 'Task was rejected')
          return
        }

        // If pending, keep polling
        if (checkCount.current >= MAX_CHECKS) {
          clearInterval(verifyIntervalRef.current!)
          setStatus('error')
          setErrorMessage('Verification timed out. Please contact support.')
        }

      } catch (err: any) {
        console.error('Verification check failed:', err)
        if (checkCount.current >= MAX_CHECKS) {
          clearInterval(verifyIntervalRef.current!)
          setStatus('error')
          setErrorMessage('Verification failed. Please try again.')
        }
      }
    }

    // Run immediately, then every 3 seconds
    await checkStatus()
    verifyIntervalRef.current = setInterval(checkStatus, CHECK_INTERVAL_MS)
  }

  // ===== RENDER =====

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="w-10 h-10 text-accent-500 animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Loading task...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-navy-800 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-gray-400 mb-6">{errorMessage}</p>
          <Link href="/dashboard/tasks" className="block">
            <button className="w-full py-3 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-bold transition flex items-center justify-center gap-2">
              <FaArrowLeft /> Back to Tasks
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-navy-800 border border-green-500/30 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <FaCheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Task Verified!</h2>
          <p className="text-gray-400 mb-6">
            You have successfully earned <span className="text-green-400 font-bold">{task?.reward_spy} SPY</span>
          </p>
          <div className="bg-navy-900 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500">New Balance</p>
            <p className="text-2xl font-bold text-white">{profile?.spy_balance || 0} SPY</p>
          </div>
          <Link href="/dashboard/tasks" className="block">
            <button className="w-full py-3 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-bold transition">
              Back to Tasks
            </button>
          </Link>
        </motion.div>
      </div>
    )
  }

  // Status: ready or verifying
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/tasks" className="p-2 bg-navy-800 rounded-lg hover:bg-navy-700 transition">
          <FaArrowLeft className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Complete Task</h1>
          <p className="text-gray-400 text-sm">{task?.title}</p>
        </div>
      </div>

      {/* Task Info Card */}
      <div className="bg-navy-800 border border-primary-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <FaShieldAlt className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-white font-bold">{task?.title}</h2>
              <p className="text-gray-400 text-sm">{task?.description || 'Complete the task to earn rewards'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Reward</p>
            <p className="text-lg font-bold text-green-400">+{task?.reward_spy} SPY</p>
          </div>
        </div>

        {/* Task URL Button */}
        <button
          onClick={handleOpenTask}
          disabled={hasClicked}
          className={`w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
            hasClicked 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-primary-500 hover:bg-primary-600 text-white'
          }`}
        >
          {hasClicked ? (
            <>
              <FaCheckCircle /> Link Opened
            </>
          ) : (
            <>
              <FaExternalLinkAlt /> Open Task Link
            </>
          )}
        </button>
      </div>

      {/* Timer / Submit Card */}
      {hasClicked && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-navy-800 border border-primary-500/20 rounded-2xl p-6 text-center"
        >
          {status === 'verifying' ? (
            <div className="py-6">
              <FaSpinner className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Verifying Task...</h3>
              <p className="text-gray-400 text-sm">Please wait while we confirm your task completion.</p>
            </div>
          ) : timeLeft > 0 ? (
            <div>
              <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
                <FaClock /> Please wait before submitting
              </div>
              <div className="text-5xl font-bold text-white mb-2">
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
              <p className="text-gray-500 text-sm mb-6">You must spend at least {MIN_INTERACTION_SECONDS / 60} minutes on the task.</p>
              <button
                disabled
                className="w-full py-3 rounded-xl bg-gray-700 text-gray-500 font-bold cursor-not-allowed"
              >
                Please Wait...
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-2 text-green-400 mb-4">
                <FaCheckCircle /> Time requirement met
              </div>
              <p className="text-gray-400 text-sm mb-6">Click below to submit and verify your task.</p>
              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-bold transition flex items-center justify-center gap-2"
              >
                <FaCheckCircle /> Submit Task
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
