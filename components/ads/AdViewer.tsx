// components/ads/AdViewer.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { FaTimes, FaClock, FaCheck, FaPlay } from 'react-icons/fa'

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
  adCount = 3,
  onComplete,
  onCancel
}: AdViewerProps) {
  const [currentAd, setCurrentAd] = useState(1)
  const [timeLeft, setTimeLeft] = useState(totalDuration)
  const [isComplete, setIsComplete] = useState(false)
  const [canClose, setCanClose] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [reward, setReward] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate reward
  useEffect(() => {
    const baseReward = adTier === 'video' ? 0.50 : 0.15
    const totalReward = baseReward * adCount
    setReward(totalReward)
  }, [adTier, adCount])

  // Start timer
  useEffect(() => {
    console.log('🎬 Starting ad sequence...')
    let elapsed = 0
    
    timerRef.current = setInterval(() => {
      elapsed += 1
      const remaining = Math.max(0, totalDuration - elapsed)
      setTimeLeft(remaining)
      
      // Update current ad number
      const adDuration = totalDuration / adCount
      const newAd = Math.min(Math.floor(elapsed / adDuration) + 1, adCount)
      if (newAd !== currentAd) {
        setCurrentAd(newAd)
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

  const handleClose = () => {
    console.log('🔴 Close button clicked, canClose:', canClose, 'isComplete:', isComplete)
    
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
      onComplete(reward, adTier, fraudScore)
    } else {
      onCancel()
    }
  }

  const progress = Math.min(((totalDuration - timeLeft) / totalDuration) * 100, 100)

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-accent-500 font-bold text-sm">Ad {currentAd}/{adCount}</span>
          <span className="text-gray-600 text-sm">•</span>
          <span className="text-gray-400 text-sm flex items-center gap-1">
            <FaClock className="text-accent-500 text-xs" /> 
            {isComplete ? 'Complete!' : `${Math.ceil(timeLeft)}s`}
          </span>
        </div>
        <button
          onClick={handleClose}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            canClose 
              ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 cursor-pointer' 
              : 'bg-gray-800/50 text-gray-600 cursor-not-allowed opacity-50'
          }`}
          disabled={!canClose}
          title={canClose ? 'Close and claim reward' : 'Watch all ads to close'}
        >
          <FaTimes className="text-lg" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Ad Content */}
        <div className="w-full max-w-2xl mx-auto text-center">
          {isComplete ? (
            <div className="animate-bounce">
              <div className="text-7xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-2">All Ads Complete!</h2>
              <p className="text-gray-400 text-lg">Click the green ✕ button to claim your reward</p>
              <div className="mt-4 inline-block bg-green-500/20 text-green-400 px-6 py-2 rounded-full text-sm font-medium">
                +{reward.toFixed(2)} SPY
              </div>
            </div>
          ) : (
            <>
              <div className="text-6xl mb-4">📺</div>
              <h2 className="text-2xl font-bold text-white mb-2">Ad {currentAd} of {adCount}</h2>
              <p className="text-gray-400 text-sm mb-6">Watch for {Math.ceil(timeLeft)} more seconds...</p>
              
              {/* Ad Container */}
              <div className="w-full bg-gray-800/50 rounded-xl p-4 min-h-[200px] flex items-center justify-center border border-gray-700">
                <div id="container-478289f3c17549c6c042b9e58c05b749" className="w-full">
                  <script 
                    async 
                    data-cfasync="false" 
                    src="https://pl30607520.effectivecpmnetwork.com/478289f3c17549c6c042b9e58c05b749/invoke.js"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Countdown Circle */}
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#374151"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke={isComplete ? "#34d399" : "#818cf8"}
                strokeWidth="4"
                fill="none"
                strokeDasharray="175.93"
                strokeDashoffset={isComplete ? 0 : 175.93 * (1 - progress / 100)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {isComplete ? '✓' : Math.ceil(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 border-t border-gray-800 p-3">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 min-w-[36px]">{Math.round(progress)}%</span>
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-accent-500 to-purple-500 transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 min-w-[60px] text-right">
                {canClose ? '✅ Claim' : `${Math.ceil(timeLeft)}s`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black/90 border-t border-gray-800 px-4 py-2 flex justify-between items-center">
        <span className="text-xs text-gray-600">Powered by Adsterra</span>
        <span className="text-xs text-gray-600">
          {canClose ? (
            <span className="text-green-400 flex items-center gap-1">
              <FaCheck className="text-xs" /> Click ✕ to claim {reward.toFixed(2)} SPY
            </span>
          ) : (
            <span>Watch all ads to earn {reward.toFixed(2)} SPY</span>
          )}
        </span>
      </div>

      {/* Warning Popup */}
      {showWarning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500/95 rounded-xl px-6 py-4 max-w-sm text-center shadow-2xl">
          <p className="text-white font-medium">⏳ Please watch the full ad to earn rewards!</p>
        </div>
      )}
    </div>
  )
}