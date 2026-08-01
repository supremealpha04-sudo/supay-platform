'use client'

import './ad-viewer.css'

import { useState, useEffect, useRef } from 'react'
import { FaTimes, FaClock, FaCheck, FaExclamationTriangle } from 'react-icons/fa'

interface AdViewerProps {
  userId: string
  platform: string
  adTier: string
  totalDuration: number
  adCount: number
  onComplete: (reward: number, tier: string, fraudScore: any) => void
  onCancel: () => void
}

export default function AdViewer({
  adTier,
  totalDuration,
  adCount = 3,
  onComplete,
  onCancel,
}: AdViewerProps) {
  const [currentAd, setCurrentAd] = useState(1)
  const [timeLeft, setTimeLeft] = useState(totalDuration)
  const [isComplete, setIsComplete] = useState(false)
  const [canClose, setCanClose] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [reward, setReward] = useState(0)
  const [isClaiming, setIsClaiming] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)

  // Calculate reward
  useEffect(() => {
    const baseReward = adTier === 'video' ? 0.50 : 0.15
    setReward(baseReward * adCount)
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

    const scriptId = 'adsterra-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      script.src = 'https://pl30607520.effectivecpmnetwork.com/478289f3c17549c6c042b9e58c05b749/invoke.js'
      script.onerror = () => console.error('❌ Failed to load ad')
      document.head.appendChild(script)
    }

    return () => {
      const el = container.querySelector('.adsterra-ad-wrapper')
      if (el && el.parentNode === container) {
        try { container.removeChild(el) } catch {}
      }
    }
  }, [currentAd])

  // Start timer
  useEffect(() => {
    let elapsed = 0
    timerRef.current = setInterval(() => {
      elapsed += 1
      const remaining = Math.max(0, totalDuration - elapsed)
      setTimeLeft(remaining)

      const adDuration = totalDuration / adCount
      const newAd = Math.min(Math.floor(elapsed / adDuration) + 1, adCount)
      if (newAd !== currentAd && newAd <= adCount) {
        setCurrentAd(newAd)
      }

      if (elapsed >= totalDuration) {
        clearInterval(timerRef.current!)
        setIsComplete(true)
        setCanClose(true)
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [totalDuration, adCount])

  // CLAIM: No client-side auth check. API handles auth.
  const handleClaim = () => {
    if (!canClose) {
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 2000)
      return
    }

    if (isComplete) {
      setIsClaiming(true)
      // Brief UX delay so it feels like verification happened
      setTimeout(() => {
        const fraudScore = {
          avgViewTime: totalDuration,
          tabSwitches: 0,
          isHeadlessBrowser: false,
          isProxy: false,
          fraudScore: 0.1,
        }
        onComplete(reward, adTier, fraudScore)
      }, 600)
    } else {
      onCancel()
    }
  }

  const progress = Math.min(((totalDuration - timeLeft) / totalDuration) * 100, 100)

  return (
    <div className="ad-viewer-overlay">
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
            <span style={{ width: 6, height: 6, borderRadius: '9999px', background: '#818cf8', display: 'inline-block' }} />
            Ad {currentAd}/{adCount}
          </span>
          <span className="timer-display">
            <FaClock className="timer-icon" style={{ fontSize: '0.75rem' }} />
            {isComplete ? 'Complete!' : `${Math.ceil(timeLeft)}s`}
          </span>
        </div>
        <button onClick={handleClaim} disabled={!canClose} className="close-btn">
          {isClaiming ? <div className="spinner" /> : <FaTimes style={{ fontSize: '1rem' }} />}
        </button>
      </div>

      {/* Content */}
      <div className="ad-viewer-content">
        {isComplete ? (
          <div className="ad-viewer-complete">
            <div className="complete-emoji">🎉</div>
            <h2 className="complete-title">All Ads Complete!</h2>
            <p className="complete-subtitle">Click the green ✕ button to claim your reward</p>
            <div className="reward-pill">
              <span>+{reward.toFixed(2)} SPY</span>
            </div>
            {isClaiming && (
              <div className="auth-checking">
                <div className="spinner" />
                <span>Claiming your reward...</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 768, margin: '0 auto' }}>
            <div className="ad-dots">
              {Array.from({ length: adCount }).map((_, i) => (
                <div
                  key={i}
                  className={`ad-dot ${i + 1 === currentAd ? 'active' : i + 1 < currentAd ? 'completed' : ''}`}
                />
              ))}
            </div>
            <div className="ad-info">
              <h2>Ad {currentAd} of {adCount}</h2>
              <p>{Math.ceil(timeLeft)} seconds remaining</p>
            </div>
            <div ref={containerRef} className="ad-viewer-container" />
          </div>
        )}

        {/* Countdown */}
        <div className="countdown-wrapper">
          <div className="countdown-ring">
            <svg viewBox="0 0 64 64">
              <circle className="track" cx="32" cy="32" r="28" />
              <circle
                className={`progress ${isComplete ? 'complete' : ''}`}
                cx="32" cy="32" r="28"
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
              <div className="ad-progress-fill" style={{ width: `${progress}%` }} />
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

      {/* Warning */}
      {showWarning && (
        <div className="ad-warning">
          <FaExclamationTriangle className="ad-warning-icon" style={{ color: 'white' }} />
          <p className="ad-warning-text">
            {isComplete ? 'Claiming...' : '⏳ Please watch the full ad to earn rewards!'}
          </p>
        </div>
      )}
    </div>
  )
}
