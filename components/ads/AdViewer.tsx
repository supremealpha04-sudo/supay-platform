// components/ads/AdViewer.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { FaTimes, FaClock, FaCheck } from 'react-icons/fa'

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
  const [timeLeft, setTimeLeft] = useState(totalDuration / adCount)
  const [totalTimeLeft, setTotalTimeLeft] = useState(totalDuration)
  const [isComplete, setIsComplete] = useState(false)
  const [canClose, setCanClose] = useState(false)
  const [reward, setReward] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate reward
  useEffect(() => {
    const baseReward = adTier === 'video' ? 0.50 : 0.15
    const totalReward = baseReward * adCount
    setReward(totalReward)
  }, [adTier, adCount])

  // Start timer
  useEffect(() => {
    console.log(`🎬 Starting ad sequence: ${adCount} ads, ${totalDuration}s total`)
    startTimer()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startTimer = () => {
    let elapsed = 0
    const adDuration = totalDuration / adCount
    
    timerRef.current = setInterval(() => {
      elapsed += 1
      const remaining = Math.max(0, adDuration - elapsed)
      setTimeLeft(remaining)
      setTotalTimeLeft(Math.max(0, totalDuration - elapsed - ((currentAd - 1) * adDuration)))
      
      // Check if current ad is complete
      if (elapsed >= adDuration) {
        // Check if all ads are complete
        if (currentAd >= adCount) {
          clearInterval(timerRef.current!)
          setIsComplete(true)
          setCanClose(true)
          console.log('✅ All ads complete!')
          return
        }
        
        // Move to next ad
        setCurrentAd(prev => prev + 1)
        elapsed = 0
        setTimeLeft(adDuration)
      }
    }, 1000)
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
      onComplete(reward, adTier, fraudScore)
    } else {
      onCancel()
    }
  }

  const totalProgress = ((adCount - currentAd) * (totalDuration / adCount) + timeLeft) / totalDuration * 100
  const totalProgressPercent = Math.min(Math.round(totalProgress), 100)

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-accent-500 font-bold">Ad {currentAd}/{adCount}</span>
          <span className="text-gray-400 text-sm">•</span>
          <span className="text-gray-400 text-sm flex items-center gap-1">
            <FaClock className="text-accent-500" /> {Math.ceil(totalTimeLeft)}s remaining
          </span>
        </div>
        <button
          onClick={handleClose}
          disabled={!canClose}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
            canClose 
              ? 'bg-gray-800 hover:bg-gray-700 text-white cursor-pointer' 
              : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
          }`}
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      {/* Main Ad Content - Simplified with placeholder */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-900/50 to-purple-900/50 relative overflow-hidden">
        {/* Ad Content Placeholder */}
        <div className="text-center p-8">
          <div className="text-8xl mb-6">📺</div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {isComplete ? '✅ All Ads Complete!' : `Ad ${currentAd} of ${adCount}`}
          </h2>
          <p className="text-gray-400 text-lg">
            {isComplete 
              ? 'Click the X button to claim your reward!' 
              : `Watch for ${Math.ceil(timeLeft)} more seconds...`
            }
          </p>
          
          {/* Adsterra container */}
          <div id="container-478289f3c17549c6c042b9e58c05b749" className="mt-6">
            <script 
              async 
              data-cfasync="false" 
              src="https://pl30607520.effectivecpmnetwork.com/478289f3c17549c6c042b9e58c05b749/invoke.js"
            />
          </div>
        </div>

        {/* Countdown Overlay */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/80 backdrop-blur-sm rounded-2xl px-6 py-4 border border-gray-700 min-w-[200px] text-center">
            <div className="text-4xl font-bold text-white mb-1">
              {isComplete ? '✅' : `${Math.ceil(timeLeft)}s`}
            </div>
            <div className="text-xs text-gray-400">
              {isComplete ? 'Complete!' : `Ad ${currentAd} of ${adCount}`}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="bg-black/80 backdrop-blur-sm p-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 min-w-[40px]">{totalProgressPercent}%</span>
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-accent-500 to-purple-500 transition-all duration-1000"
                  style={{ width: `${totalProgressPercent}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 min-w-[60px]">
                {canClose ? '✅ Done' : `${Math.ceil(totalTimeLeft)}s`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black/80 border-t border-gray-800 p-2 flex justify-between items-center">
        <span className="text-xs text-gray-500">Powered by Adsterra</span>
        <span className="text-xs text-gray-500">
          {canClose ? (
            <span className="text-green-400 flex items-center gap-1">
              <FaCheck /> Click ✕ to claim {reward.toFixed(2)} SPY
            </span>
          ) : (
            <span>Watch all ads to earn {reward.toFixed(2)} SPY</span>
          )}
        </span>
      </div>

      {/* Warning Popup */}
      {showWarning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500/90 rounded-xl p-4 max-w-sm text-center animate-pulse">
          <p className="text-white font-medium">Please watch the full ad to earn rewards! 🎯</p>
        </div>
      )}
    </div>
  )
}