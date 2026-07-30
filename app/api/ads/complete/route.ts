// components/ads/AdViewer.tsx (Minimal working version)
'use client'

import { useState, useEffect, useRef } from 'react'
import { FaTimes } from 'react-icons/fa'

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
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    console.log('🎬 Starting ad...')
    let elapsed = 0
    
    timerRef.current = setInterval(() => {
      elapsed += 1
      const remaining = Math.max(0, totalDuration - elapsed)
      setTimeLeft(remaining)
      
      // Simulate ad switching
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
  }, [])

  const handleClose = () => {
    if (!canClose) {
      alert('Please watch the full ad to earn rewards!')
      return
    }
    
    if (isComplete) {
      const reward = adTier === 'video' ? 1.00 : 0.45
      onComplete(reward, adTier, { fraudScore: 0.1 })
    } else {
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-accent-500 font-bold">Ad {currentAd}/{adCount}</span>
          <span className="text-gray-400 text-sm flex items-center gap-1">
            ⏱️ {Math.ceil(timeLeft)}s remaining
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

      {/* Ad Content */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/50 to-purple-900/50 p-8">
        <div className="text-8xl mb-6">📺</div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {isComplete ? '✅ Complete!' : `Ad ${currentAd} of ${adCount}`}
        </h2>
        <p className="text-gray-400 text-lg mb-4">
          {isComplete 
            ? 'Click the X button to claim your reward!' 
            : `Watch for ${Math.ceil(timeLeft)} more seconds...`
          }
        </p>
        
        {/* Adsterra container */}
        <div className="w-full max-w-2xl bg-gray-800/50 rounded-xl p-4 min-h-[200px] flex items-center justify-center">
          <div id="container-478289f3c17549c6c042b9e58c05b749" className="w-full">
            <script 
              async 
              data-cfasync="false" 
              src="https://pl30607520.effectivecpmnetwork.com/478289f3c17549c6c042b9e58c05b749/invoke.js"
            />
          </div>
        </div>

        {/* Progress */}
        <div className="w-full max-w-2xl mt-4">
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent-500 to-purple-500 transition-all duration-1000"
              style={{ width: `${((totalDuration - timeLeft) / totalDuration) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Progress</span>
            <span>{Math.round(((totalDuration - timeLeft) / totalDuration) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black/80 border-t border-gray-800 p-2 flex justify-between items-center">
        <span className="text-xs text-gray-500">Powered by Adsterra</span>
        <span className="text-xs text-gray-500">
          {canClose ? (
            <span className="text-green-400">✅ Click ✕ to claim reward</span>
          ) : (
            <span>Watch all ads to earn</span>
          )}
        </span>
      </div>
    </div>
  )
}