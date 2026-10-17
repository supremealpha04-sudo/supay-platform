'use client'

import './ad-viewer.css'
import { useState, useEffect } from 'react'
import { FaTimes, FaCheck, FaExternalLinkAlt, FaMousePointer } from 'react-icons/fa'

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
  const [hasClicked, setHasClicked] = useState(false)
  const [timeLeft, setTimeLeft] = useState(totalDuration)
  const [isComplete, setIsComplete] = useState(false)
  const [canClose, setCanClose] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  // Uses Vercel Env Variable first, then falls back to your working link
  const adUrl = process.env.NEXT_PUBLIC_ADSTERRA_DIRECT_LINK || 'https://www.profitableratecpmnetwork.com/cwdunazwc?key=c7f5960be7e239a274f2f429048b692b'

  // Timer only starts AFTER user clicks the ad link
  useEffect(() => {
    if (!hasClicked) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(interval)
          setIsComplete(true)
          setCanClose(true)
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [hasClicked])

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

  const progress = hasClicked 
    ? ((totalDuration - timeLeft) / totalDuration) * 100 
    : 0

  return (
    <div className="ad-viewer-overlay">
      {/* Header */}
      <div className="ad-viewer-header">
        <div className="ad-viewer-status">
          {isComplete ? 'Complete!' : hasClicked ? `Watching... ${timeLeft}s` : 'Ready'}
        </div>
        <button
          onClick={handleClose}
          disabled={!canClose}
          className={`ad-close-btn ${canClose ? 'active' : 'disabled'}`}
        >
          <FaTimes />
        </button>
      </div>

      {/* Main Content */}
      <div className="ad-viewer-content">
        {isComplete ? (
          <div className="ad-viewer-success">
            <div className="ad-success-icon">🎉</div>
            <h2>Reward Ready!</h2>
            <p>Click the green ✕ to claim your 0.05 SPY</p>
          </div>
        ) : !hasClicked ? (
          <div className="ad-viewer-start">
            <div className="ad-start-icon">📺</div>
            <h2>Watch Ad to Earn</h2>
            <p>
              Click the button below to open the ad. <br/>
              Keep it open for <strong>{totalDuration} seconds</strong> to earn your reward.
            </p>
            
            {/* Clickable "Open Ad" Button */}
            <a 
              href={adUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => setHasClicked(true)}
              className="ad-open-btn"
            >
              <FaExternalLinkAlt /> Open Ad
            </a>

            <p className="ad-start-hint">
              <FaMousePointer className="inline mr-1" />
              You must click to open the ad.
            </p>
          </div>
        ) : (
          <div className="ad-viewer-countdown">
            <div className="ad-countdown-icon">⏱️</div>
            <h2>Ad is Open</h2>
            <p>Keep the ad open and come back.</p>
            
            <div className="ad-countdown-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="#374151" strokeWidth="8" fill="none" />
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
              <FaCheck /> Click ✕ to claim 0.005 SPY
            </span>
          ) : hasClicked ? (
            <span>Watch {timeLeft}s more</span>
          ) : (
            <span>Click "Open Ad" to start</span>
          )}
        </span>
      </div>

      {/* Warning Popup */}
      {showWarning && (
        <div className="ad-warning-popup">
          ⏳ Please complete the ad first!
        </div>
      )}
    </div>
  )
}
