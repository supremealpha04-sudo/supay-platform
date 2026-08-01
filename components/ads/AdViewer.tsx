'use client'

import './ad-viewer.css'

import { useState, useEffect, useRef } from 'react'
import { FaTimes, FaClock, FaCheck, FaExclamationTriangle } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AdViewerProps {
  userId: string
  platform: string
  adTier: string
  totalDuration: number
  adCount: number
  onComplete: (reward: number, tier: string, fraudScore: any) => void
  onCancel: () => void
  onAuthRequired?: () => void
}

export default function AdViewer({
  userId,
  platform,
  adTier,
  totalDuration,
  adCount = 3,
  onComplete,
  onCancel,
  onAuthRequired
}: AdViewerProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [currentAd, setCurrentAd] = useState(1)
  const [timeLeft, setTimeLeft] = useState(totalDuration)
  const [isComplete, setIsComplete] = useState(false)
  const [canClose, setCanClose] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [reward, setReward] = useState(0)
  const [isAuthChecking, setIsAuthChecking] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authVerifyAttempts, setAuthVerifyAttempts] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)
  const adContainerRef = useRef<HTMLDivElement | null>(null)

  // Calculate reward
  useEffect(() => {
    const baseReward = adTier === 'video' ? 0.50 : 0.15
    const totalReward = baseReward * adCount
    setReward(totalReward)
  }, [adTier, adCount])

  // Load Adsterra ad
  useEffect(() => {
    if (!containerRef.current || scriptLoadedRef.current) return
    
    scriptLoadedRef.current = true
    const container = containerRef.current
    
    container.innerHTML = ''
    
    const wrapper = document.createElement('div')
    wrapper.className = 'adsterra-ad-wrapper'
    wrapper.id = `adsterra-wrapper-${currentAd}`
    
    const adDiv = document.createElement('div')
    adDiv.id = 'container-478289f3c17549c6c042b9e58c05b749'
    adDiv.className = 'adsterra-ad-container'
    
    wrapper.appendChild(adDiv)
    container.appendChild(wrapper)
    adContainerRef.current = wrapper

    const scriptId = 'adsterra-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      script.src = 'https://pl30607520.effectivecpmnetwork.com/478289f3c17549c6c042b9e58c05b749/invoke.js'
      
      script.onload = () => {
        console.log('✅ Adsterra ad loaded')
      }
      
      script.onerror = () => {
        console.error('❌ Failed to load ad')
      }
      
      document.head.appendChild(script)
    }

    return () => {
      if (container && container.querySelector('.adsterra-ad-wrapper')) {
        try {
          const wrapperEl = container.querySelector('.adsterra-ad-wrapper')
          if (wrapperEl && wrapperEl.parentNode === container) {
            container.removeChild(wrapperEl)
          }
        } catch (e) {
          console.warn('Cleanup error:', e)
        }
      }
    }
  }, [currentAd])

  // Start timer
  useEffect(() => {
    console.log('🎬 Starting ad sequence...')
    let elapsed = 0
    
    timerRef.current = setInterval(() => {
      elapsed += 1
      const remaining = Math.max(0, totalDuration - elapsed)
      setTimeLeft(remaining)
      
      const adDuration = totalDuration / adCount
      const newAd = Math.min(Math.floor(elapsed / adDuration) + 1, adCount)
      if (newAd !== currentAd && newAd <= adCount) {
        setCurrentAd(newAd)
        if (containerRef.current) {
          const wrapper = containerRef.current.querySelector('.adsterra-ad-wrapper')
          if (wrapper) {
            wrapper.id = `adsterra-wrapper-${newAd}`
          }
        }
      }
      
      if (elapsed >= totalDuration) {
        clearInterval(timerRef.current!)
        setIsComplete(true)
        setCanClose(true)
        console.log('✅ All ads complete!')
      }
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [totalDuration, adCount])

  // Check auth before claiming reward — with timeout & retry
  const checkAuthAndClaim = async () => {
    setIsAuthChecking(true)
    setAuthError(null)
    
    try {
      // ⏱️ TIMEOUT: If Supabase hangs, abort after 8 seconds
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth verification timed out')), 8000)
      )
      
      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any

      if (error || !session) {
        setShowWarning(true)
        setTimeout(() => {
          setShowWarning(false)
          if (onAuthRequired) onAuthRequired()
          else router.push('/login?redirect=/dashboard/earn')
        }, 1500)
        return
      }

      // Success — claim reward
      const fraudScore = {
        avgViewTime: totalDuration,
        tabSwitches: 0,
        isHeadlessBrowser: false,
        isProxy: false,
        fraudScore: 0.1
      }
      
      onComplete(reward, adTier, fraudScore)
      
    } catch (error: any) {
      console.error('❌ Auth check error:', error)
      setAuthError(error?.message || 'Verification failed')
      setAuthVerifyAttempts(prev => prev + 1)
    } finally {
      setIsAuthChecking(false)
    }
  }

  // Force claim — bypasses hanging auth check
  const forceClaim = () => {
    const fraudScore = {
      avgViewTime: totalDuration,
      tabSwitches: 0,
      isHeadlessBrowser: false,
      isProxy: false,
      fraudScore: 0.1
    }
    onComplete(reward, adTier, fraudScore)
  }

  const handleClose = () => {
    console.log('🔴 Close button clicked, canClose:', canClose)
    
    if (!canClose) {
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 2000)
      return
    }
    
    if (isComplete) {
      checkAuthAndClaim()
    } else {
      onCancel()
    }
  }

  const progress = Math.min(((totalDuration - timeLeft) / totalDuration) * 100, 100)

  return (
    <div className="ad-viewer-overlay">
      {/* SVG Gradient Definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Header */}
      <div className="ad-viewer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="ad-badge">
            <span style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '9999px', 
              background: '#818cf8',
              display: 'inline-block'
            }} className="animate-pulse" />
            Ad {currentAd}/{adCount}
          </span>
          <span className="timer-display">
            <FaClock className="timer-icon" style={{ fontSize: '0.75rem' }} /> 
            {isComplete ? 'Complete!' : `${Math.ceil(timeLeft)}s`}
          </span>
        </div>
        <button
          onClick={handleClose}
          disabled={!canClose}
          className="close-btn"
        >
          {isAuthChecking ? (
            <div className="spinner" />
          ) : (
            <FaTimes style={{ fontSize: '1rem' }} />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="ad-viewer-content">
        {isComplete ? (
          <div className="ad-viewer-complete">
            <div className="complete-emoji">🎉</div>
            <h2 className="complete-title">All Ads Complete!</h2>
            <p className="complete-subtitle">Click the green ✕ button to claim your reward</p>
            <div className="reward-pill">
              <span>+{reward.toFixed(2)} SPY</span>
            </div>
            
            {/* Auth Error with Retry / Force Claim */}
            {authError && (
              <div className="auth-error-box">
                <p className="auth-error-text">⚠️ {authError}</p>
                <div className="auth-error-actions">
                  <button onClick={checkAuthAndClaim} className="auth-retry-btn">
                    🔄 Retry
                  </button>
                  <button onClick={forceClaim} className="auth-force-btn">
                    ✓ Force Claim
                  </button>
                </div>
                {authVerifyAttempts > 1 && (
                  <p className="auth-error-hint">
                    If retry keeps failing, use Force Claim. Your API will verify the session.
                  </p>
                )}
              </div>
            )}
            
            {isAuthChecking && !authError && (
              <div className="auth-checking">
                <div className="spinner" />
                <span>Verifying your account...</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '768px', margin: '0 auto' }}>
            {/* Ad Dots */}
            <div className="ad-dots">
              {Array.from({ length: adCount }).map((_, i) => (
                <div
                  key={i}
                  className={`ad-dot ${
                    i + 1 === currentAd ? 'active' : 
                    i + 1 < currentAd ? 'completed' : ''
                  }`}
                />
              ))}
            </div>
            
            <div className="ad-info">
              <h2>Ad {currentAd} of {adCount}</h2>
              <p>{Math.ceil(timeLeft)} seconds remaining</p>
            </div>
            
            <div 
              ref={containerRef}
              className="ad-viewer-container"
            />
          </div>
        )}

        {/* Countdown Circle */}
        <div className="countdown-wrapper">
          <div className="countdown-ring">
            <svg viewBox="0 0 64 64">
              <circle className="track" cx="32" cy="32" r="28" />
              <circle
                className={`progress ${isComplete ? 'complete' : ''}`}
                cx="32"
                cy="32"
                r="28"
                strokeDasharray="175.93"
                strokeDashoffset={isComplete ? 0 : 175.93 * (1 - progress / 100)}
              />
            </svg>
            <div className={`countdown-text ${isComplete ? 'complete' : ''}`}>
              {isComplete ? '✓' : Math.ceil(timeLeft)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="ad-progress-bar">
          <div className="ad-progress-inner">
            <span className="ad-progress-label percent">{Math.round(progress)}%</span>
            <div className="ad-progress-track">
              <div 
                className="ad-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={`ad-progress-label status ${canClose ? 'text-green-400' : 'text-gray-500'}`}>
              {canClose ? 'Claim' : `${Math.ceil(timeLeft)}s`}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="ad-viewer-footer">
        <span className="footer-brand">Powered by Adsterra</span>
        <span className={`footer-reward ${canClose ? 'ready' : 'pending'}`}>
          {canClose ? (
            <>
              <FaCheck style={{ fontSize: '0.75rem' }} /> Claim {reward.toFixed(2)} SPY
            </>
          ) : (
            `Watch all ads to earn ${reward.toFixed(2)} SPY`
          )}
        </span>
      </div>

      {/* Warning Popup */}
      {showWarning && (
        <div className="ad-warning">
          <FaExclamationTriangle className="ad-warning-icon" style={{ color: 'white' }} />
          <p className="ad-warning-text">
            {isComplete ? 
              'Please log in to claim your reward! Redirecting...' : 
              '⏳ Please watch the full ad to earn rewards!'
            }
          </p>
        </div>
      )}
    </div>
  )
}
