// components/ads/AdViewer.tsx
'use client'

import './ad-viewer.css'

import { useState, useEffect } from 'react'
import { FaTimes, FaClock, FaCheck, FaMousePointer, FaExternalLinkAlt } from 'react-icons/fa'

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
  adCount = 1,
  onComplete,
  onCancel
}: AdViewerProps) {
  const [hasClicked, setHasClicked] = useState(false)
  const [timeLeft, setTimeLeft] = useState(totalDuration)
  const [isComplete, setIsComplete] = useState(false)
  const [canClose, setCanClose] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  // Timer only starts AFTER user clicks
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

  // Handle "Open Ad" click
  const handleOpenAd = () => {
    // Open Adsterra direct link in new tab
    const adUrl = process.env.NEXT_PUBLIC_ADSTERRA_DIRECT_LINK || 'https://www.effectivecpmnetwork.com/'
    
    window.open(adUrl, '_blank', 'noopener,noreferrer')
    
    // Start timer
    setHasClicked(true)
  }

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
    <div className="fixed inset-0 z-[99999] bg-black flex flex-col ad-viewer-overlay">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-accent-500 font-bold text-sm">
            {isComplete ? 'Complete!' : hasClicked ? `Watching... ${timeLeft}s` : 'Ready'}
          </span>
        </div>
        <button
          onClick={handleClose}
          disabled={!canClose}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            canClose 
              ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 cursor-pointer' 
              : 'bg-gray-800/50 text-gray-600 cursor-not-allowed opacity-50'
          }`}
        >
          <FaTimes className="text-lg" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {isComplete ? (
          <div className="text-center animate-bounce">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">Reward Ready!</h2>
            <p className="text-gray-400 text-lg mb-4">Click the green ✕ to claim your reward</p>
            <div className="inline-block bg-green-500/20 text-green-400 px-6 py-2 rounded-full text-sm font-medium">
              +0.05 SPY
            </div>
          </div>
        ) : !hasClicked ? (
          <div className="text-center max-w-md">
            <div className="text-7xl mb-6">📺</div>
            <h2 className="text-2xl font-bold text-white mb-3">Watch Ad to Earn</h2>
            <p className="text-gray-400 mb-6">
              Click the button below to open the ad. Keep it open for <strong className="text-white">{totalDuration} seconds</strong> to earn your reward.
            </p>
            
            <button
              onClick={handleOpenAd}
              className="inline-flex items-center gap-3 px-8 py-4 bg-accent-500 hover:bg-accent-600 text-white font-bold rounded-xl transition-all transform hover:scale-105"
            >
              <FaExternalLinkAlt />
              Open Ad
            </button>

            <p className="text-xs text-gray-500 mt-6">
              <FaMousePointer className="inline mr-1" />
              You must click to open the ad
            </p>
          </div>
        ) : (
          <div className="text-center max-w-md">
            <div className="text-7xl mb-6 animate-pulse">⏱️</div>
            <h2 className="text-2xl font-bold text-white mb-3">Ad is Open</h2>
            <p className="text-gray-400 mb-6">
              Keep the ad open and come back. You have <strong className="text-accent-500">{timeLeft}s</strong> remaining.
            </p>
            
            {/* Circular Countdown */}
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="42" stroke="#374151" strokeWidth="6" fill="none" />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="#818cf8"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 * (1 - progress / 100)}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">{timeLeft}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-black/90 border-t border-gray-800 px-4 py-3 flex justify-between items-center">
        <span className="text-xs text-gray-600">Powered by Adsterra</span>
        <span className="text-xs text-gray-600">
          {canClose ? (
            <span className="text-green-400">✅ Click ✕ to claim 0.05 SPY</span>
          ) : hasClicked ? (
            <span>Watch {timeLeft}s more</span>
          ) : (
            <span>Click "Open Ad" to start</span>
          )}
        </span>
      </div>

      {/* Warning Popup */}
      {showWarning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[99999] bg-red-500/95 rounded-xl px-6 py-4 max-w-sm text-center shadow-2xl">
          <p className="text-white font-medium">⏳ Please complete the ad first!</p>
        </div>
      )}
    </div>
  )
}
