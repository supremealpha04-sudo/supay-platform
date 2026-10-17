// components/ads/AdViewer.tsx
'use client'

import './ad-viewer.css'
import { useState, useEffect, useRef } from 'react'
import { FaTimes, FaCheck, FaMousePointer, FaSpinner } from 'react-icons/fa'

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
  userId,
  platform,
  adTier,
  totalDuration,
  onComplete,
  onCancel
}: AdViewerProps) {
  const [hasStarted, setHasStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(totalDuration)
  const [isComplete, setIsComplete] = useState(false)
  const [canClose, setCanClose] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [adError, setAdError] = useState<string | null>(null)

  const scriptLoadedRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load Adsterra Ad Script
  useEffect(() => {
    if (scriptLoadedRef.current) return
    scriptLoadedRef.current = true

    const adScriptUrl = 'https://pl30607520.profitableratecpmnetwork.com/478289f3c17549c6c042b9e58c05b749/invoke.js'
    const containerId = 'container-478289f3c17549c6c042b9e58c05b749'

    // Check if script already exists (avoid duplicates)
    const existingScript = document.querySelector(`script[src="${adScriptUrl}"]`)
    if (existingScript) {
      setIsLoading(false)
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    script.src = adScriptUrl

    script.onload = () => {
      console.log('✅ Adsterra script loaded')
      setIsLoading(false)
    }

    script.onerror = () => {
      console.error('❌ Adsterra script failed to load')
      setAdError('Failed to load ad. Please try again later.')
      setIsLoading(false)
    }

    document.head.appendChild(script)

    // Create container for ad
    if (containerRef.current) {
      const adDiv = document.createElement('div')
      adDiv.id = containerId
      adDiv.className = 'adsterra-ad-container'
      containerRef.current.appendChild(adDiv)
    }

    return () => {
      // Cleanup on unmount
      if (containerRef.current) {
        const adDiv = containerRef.current.querySelector(`#${containerId}`)
        if (adDiv) adDiv.remove()
      }
    }
  }, [])

  // Timer (only when user starts watching)
  useEffect(() => {
    if (!hasStarted) return

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(timerRef.current!)
          setIsComplete(true)
          setCanClose(true)
          return 0
        }
        return next
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [hasStarted])

  const handleClose = () => {
    if (!canClose) {
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 2000)
      return
    }

    if (isComplete) {
      const fraudScore = {
        avgViewTime: totalDuration,
        tabSwitches: 0,
        isHeadlessBrowser: false,
        isProxy: false,
        fraudScore: 0.1
      }
      onComplete(0.05, adTier, fraudScore)
    } else {
      onCancel()
    }
  }

  const handleStart = () => {
    if (adError) return
    setHasStarted(true)
  }

  const progress = hasStarted
    ? ((totalDuration - timeLeft) / totalDuration) * 100
    : 0

  return (
    <div className="ad-viewer-overlay">
      {/* Header */}
      <div className="ad-viewer-header">
        <div className="ad-viewer-status">
          {isComplete
            ? 'Complete!'
            : hasStarted
            ? `Watching... ${timeLeft}s`
            : 'Ready'}
        </div>
        <button
          onClick={handleClose}
          disabled={!canClose}
          className={`ad-close-btn ${canClose ? 'active' : 'disabled'}`}
        >
          <FaTimes />
        </button>
      </div>

      {/* Content */}
      <div className="ad-viewer-content">
        {isComplete ? (
          <div className="ad-viewer-success">
            <div className="ad-success-icon">🎉</div>
            <h2>Reward Ready!</h2>
            <p>Click the green ✕ to claim your 0.05 SPY</p>
          </div>
        ) : !hasStarted ? (
          <div className="ad-viewer-start">
            <div className="ad-start-icon">📺</div>
            <h2>Watch Ad to Earn</h2>
            <p>
              Click the button below to start the ad. <br />
              Watch for <strong>{totalDuration} seconds</strong> to earn your reward.
            </p>

            {adError ? (
              <div className="ad-error-box">
                <p>{adError}</p>
                <button
                  onClick={() => {
                    setAdError(null)
                    setIsLoading(true)
                  }}
                  className="ad-retry-btn"
                >
                  Retry
                </button>
              </div>
            ) : (
              <button
                onClick={handleStart}
                disabled={isLoading}
                className="ad-open-btn"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="spin" /> Loading Ad...
                  </>
                ) : (
                  <>
                    <FaMousePointer /> Start Watching
                  </>
                )}
              </button>
            )}

            <p className="ad-start-hint">
              The ad will load in this window.
            </p>
          </div>
        ) : (
          <div className="ad-viewer-countdown">
            <div className="ad-countdown-icon">⏱️</div>
            <h2>Watching Ad</h2>
            <p>Stay on this page for {timeLeft} more seconds.</p>

            {/* Adsterra Container - script injects ad here */}
            <div
              ref={containerRef}
              className="ad-viewer-container"
            >
              {isLoading && (
                <div className="ad-loading-overlay">
                  <div className="ad-loading-spinner" />
                </div>
              )}
            </div>

            {/* Countdown Circle */}
            <div className="ad-countdown-circle" style={{ marginTop: '1.5rem' }}>
              <svg viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#374151"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#818cf8"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 * (1 - progress / 100)}
                  className="ad-countdown-progress"
                />
              </svg>
              <span className="ad-countdown-text">{timeLeft}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="ad-viewer-footer">
        <span className="ad-powered-by">Powered by {platform}</span>
        <span className="ad-footer-status">
          {canClose ? (
            <span className="text-green-400 flex items-center gap-1">
              <FaCheck /> Click ✕ to claim 0.05 SPY
            </span>
          ) : hasStarted ? (
            <span>Watch {timeLeft}s more</span>
          ) : (
            <span>Click "Start Watching" to begin</span>
          )}
        </span>
      </div>

      {/* Warning */}
      {showWarning && (
        <div className="ad-warning-popup">
          ⏳ Please complete the ad first!
        </div>
      )}
    </div>
  )
}
