'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaShieldAlt, FaBan, FaSpinner, FaExclamationTriangle,
  FaCheckCircle, FaRobot, FaEye, FaTimes, FaCoins,
  FaClock, FaPlay
} from 'react-icons/fa'
import { fraudDetection, FraudScore } from '@/lib/ads/FraudDetection'

interface AdViewerProps {
  userId: string
  adUrl: string
  adTier: 'cpm' | 'cpc' | 'cpa' | 'premium_video' | 'offerwall'
  minDuration?: number
  onComplete: (reward: number, tier: string, fraudScore: FraudScore) => void
  onCancel: () => void
}

type ViewerState = 'pre-check' | 'loading' | 'playing' | 'verifying' | 'completed' | 'blocked' | 'error'

export default function AdViewer({
  userId,
  adUrl,
  adTier,
  minDuration = 15,
  onComplete,
  onCancel,
}: AdViewerProps) {
  const [state, setState] = useState<ViewerState>('pre-check')
  const [countdown, setCountdown] = useState(minDuration)
  const [fraudScore, setFraudScore] = useState<FraudScore | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef(0)

  useEffect(() => {
    runPreCheck()
    return () => {
      fraudDetection.stopTracking()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const runPreCheck = async () => {
    fraudDetection.startTracking()
    const signals = await fraudDetection.collectSignals(minDuration)
    const score = fraudDetection.calculateScore(signals)
    setFraudScore(score)

    if (score.recommendation === 'block') {
      setState('blocked')
      await reportFraud(signals, score, 'pre_check')
      return
    }

    setState('loading')
    setTimeout(() => {
      setState('playing')
      startTimeRef.current = Date.now()
      startCountdown()
    }, 1500)
  }

  const startCountdown = () => {
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleComplete = async () => {
    setState('verifying')
    fraudDetection.stopTracking()

    const finalSignals = await fraudDetection.collectSignals(minDuration)
    const finalScore = fraudDetection.calculateScore(finalSignals)
    setFraudScore(finalScore)

    if (finalScore.recommendation === 'block') {
      setState('blocked')
      await reportFraud(finalSignals, finalScore, 'post_watch')
      return
    }

    const actualDuration = (Date.now() - startTimeRef.current) / 1000
    if (actualDuration < minDuration * 0.85) {
      setState('error')
      setErrorMsg(`View too short: ${actualDuration.toFixed(1)}s`)
      await reportFraud(finalSignals, finalScore, 'short_view')
      return
    }

    setState('completed')
    onComplete(0, adTier, finalScore)
  }

  const reportFraud = async (signals: any, score: FraudScore, reason: string) => {
    try {
      await fetch('/api/ads/fraud-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, signals, score, reason }),
      })
    } catch (e) { console.error('Fraud report failed:', e) }
  }

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    fraudDetection.stopTracking()
    onCancel()
  }

  const circumference = 2 * Math.PI * 40

  const getStateIcon = () => {
    switch (state) {
      case 'pre-check': return <FaShieldAlt className="text-5xl text-accent-500 animate-pulse" />
      case 'blocked': return <FaBan className="text-5xl text-red-500" />
      case 'loading': return <FaSpinner className="text-3xl text-accent-500 animate-spin" />
      case 'playing': return <FaPlay className="text-3xl text-accent-500" />
      case 'verifying': return <FaSpinner className="text-3xl text-green-500 animate-spin" />
      case 'completed': return <FaCheckCircle className="text-5xl text-green-500" />
      case 'error': return <FaExclamationTriangle className="text-5xl text-red-500" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-5xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            {state === 'blocked' ? (
              <FaBan className="text-red-500" />
            ) : state === 'completed' ? (
              <FaCheckCircle className="text-green-500" />
            ) : (
              <FaShieldAlt className="text-green-500" />
            )}
            <span className="font-semibold text-white text-sm">
              {state === 'pre-check' ? 'Security Check' :
               state === 'blocked' ? 'Access Denied' :
               state === 'playing' ? `${countdown}s left` :
               state === 'verifying' ? 'Verifying' :
               state === 'completed' ? 'Verified!' :
               state === 'error' ? 'Failed' : 'Loading'}
            </span>
            <span className="text-xs text-gray-500 ml-2">({adTier.toUpperCase()})</span>
          </div>

          {fraudScore && state !== 'pre-check' && (
            <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              fraudScore.score < 30 ? 'bg-green-500/20 text-green-400' :
              fraudScore.score < 60 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              Risk: {fraudScore.score}
            </div>
          )}

          <button onClick={handleCancel} className="text-xs text-red-400 hover:text-red-300">
            {state === 'playing' ? 'Cancel' : 'Close'}
          </button>
        </div>

        {/* Content */}
        <div className="relative h-[420px] bg-gray-950">
          <AnimatePresence mode="wait">

            {/* Pre-check */}
            {state === 'pre-check' && (
              <motion.div key="pre" className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {getStateIcon()}
                <h3 className="text-lg font-bold text-white mt-4">Security Check</h3>
                <p className="text-gray-400 text-sm">Verifying browser...</p>
                <div className="flex gap-1 mt-4">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-2 h-2 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Blocked */}
            {state === 'blocked' && (
              <motion.div key="blocked" className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                {getStateIcon()}
                <h3 className="text-xl font-bold text-white mt-4 mb-2">Access Blocked</h3>
                <p className="text-gray-400 text-sm mb-4 max-w-sm">Suspicious activity detected. Session logged.</p>
                {fraudScore && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 max-w-sm w-full text-left">
                    <h4 className="text-red-400 text-sm font-semibold mb-2 flex items-center gap-2">
                      <FaRobot /> Issues:
                    </h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                      {fraudScore.flags.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                            f.severity === 'critical' ? 'bg-red-500' :
                            f.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                          }`} />
                          <span>{f.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button onClick={onCancel} className="mt-4 px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600">
                  Return
                </button>
              </motion.div>
            )}

            {/* Loading */}
            {state === 'loading' && (
              <motion.div key="loading" className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {getStateIcon()}
                <p className="text-gray-400 text-sm mt-3">Loading ad...</p>
              </motion.div>
            )}

            {/* Playing */}
            {state === 'playing' && (
              <motion.div key="playing" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <iframe
                  src={adUrl}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  title="Ad"
                />
                <div className="absolute top-3 right-3">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,122,26,0.2)" strokeWidth="8" />
                      <motion.circle cx="50" cy="50" r="40" fill="none" stroke="#FF7A1A" strokeWidth="8"
                        strokeLinecap="round" strokeDasharray={circumference}
                        animate={{ strokeDashoffset: circumference * (1 - countdown / minDuration) }}
                        transition={{ duration: 1, ease: 'linear' }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">{countdown}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1.5 rounded-full text-xs text-gray-400">
                  <FaEye className="inline mr-1" /> Keep focused
                </div>
              </motion.div>
            )}

            {/* Verifying */}
            {state === 'verifying' && (
              <motion.div key="verify" className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {getStateIcon()}
                <p className="text-gray-400 text-sm mt-3">Verifying view...</p>
              </motion.div>
            )}

            {/* Completed */}
            {state === 'completed' && (
              <motion.div key="done" className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                {getStateIcon()}
                <h3 className="text-xl font-bold text-white mt-4 mb-1">Verified!</h3>
                <p className="text-gray-400 text-sm">Reward processing...</p>
              </motion.div>
            )}

            {/* Error */}
            {state === 'error' && (
              <motion.div key="error" className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {getStateIcon()}
                <h3 className="text-lg font-bold text-white mt-4 mb-2">Failed</h3>
                <p className="text-gray-400 text-sm mb-4">{errorMsg}</p>
                <button onClick={onCancel} className="px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600">
                  Go Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {state === 'playing' && (
          <div className="h-1 bg-gray-800">
            <motion.div className="h-full bg-gradient-to-r from-accent-500 to-green-500"
              initial={{ width: '100%' }}
              animate={{ width: `${(countdown / minDuration) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
