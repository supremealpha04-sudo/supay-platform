// components/ads/AdViewer.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { FaTimes, FaClock, FaCheck } from 'react-icons/fa'

interface AdViewerProps {
  userId: string
  platform: string
  adTier: string
  totalDuration: number // Total time for all ads combined
  adCount: number // Number of ads to show in sequence
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
  const [adLoaded, setAdLoaded] = useState(false)
  const [reward, setReward] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate reward based on ad tier and count
  useEffect(() => {
    const baseReward = adTier === 'video' ? 0.50 : 0.15
    const totalReward = baseReward * adCount
    setReward(totalReward)
  }, [adTier, adCount])

  useEffect(() => {
    console.log(`🎬 Starting ad sequence: ${adCount} ads, ${totalDuration}s total`)
    
    loadAd(currentAd)
    startTimer()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const loadAd = (adNumber: number) => {
    setAdLoaded(false)
    setTimeLeft(totalDuration / adCount)
    
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
      
      const adContainer = document.createElement('div')
      adContainer.className = 'w-full h-full flex items-center justify-center'
      
      // Show loading state with ad number
      adContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center w-full h-full p-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
          <div class="text-7xl mb-6">📺</div>
          <h2 class="text-2xl font-bold text-white mb-2">Ad ${adNumber} of ${adCount}</h2>
          <p class="text-gray-400 text-sm">Loading ad content...</p>
          <div class="mt-4 w-12 h-12 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
        </div>
      `
      
      containerRef.current.appendChild(adContainer)
      
      // Load actual Adsterra ad
      setTimeout(() => {
        if (containerRef.current) {
          // Create ad container with Adsterra tag
          const adWrapper = document.createElement('div')
          adWrapper.className = 'w-full h-full flex items-center justify-center bg-gray-900'
          
          // Adsterra Native Banner Tag
          adWrapper.innerHTML = `
            <div class="w-full h-full flex items-center justify-center">
              <div id="adsterra-container-${adNumber}" class="w-full h-full">
                <div id="container-478289f3c17549c6c042b9e58c05b749"></div>
              </div>
            </div>
          `
          
          containerRef.current.innerHTML = ''
          containerRef.current.appendChild(adWrapper)
          
          // Load Adsterra script
          const script = document.createElement('script')
          script.async = true
          script.setAttribute('data-cfasync', 'false')
          script.src = 'https://pl30607520.effectivecpmnetwork.com/478289f3c17549c6c042b9e58c05b749/invoke.js'
          
          script.onload = () => {
            console.log(`✅ Ad ${adNumber} loaded successfully`)
            setAdLoaded(true)
          }
          
          script.onerror = () => {
            console.error(`❌ Failed to load ad ${adNumber}`)
            setAdLoaded(true) // Continue anyway
          }
          
          document.body.appendChild(script)
          
          // Also add container div to body if needed
          const bodyContainer = document.createElement('div')
          bodyContainer.id = 'container-478289f3c17549c6c042b9e58c05b749'
          bodyContainer.style.display = 'block'
          bodyContainer.style.width = '100%'
          bodyContainer.style.height = '100%'
          document.body.appendChild(bodyContainer)
          
          // Set loaded after a delay
          setTimeout(() => {
            setAdLoaded(true)
          }, 2000)
        }
      }, 1000)
    }
  }

  const startTimer = () => {
    let elapsed = 0
    const adDuration = totalDuration / adCount
    
    timerRef.current = setInterval(() => {
      elapsed += 1
      const remaining = Math.max(0, adDuration - elapsed)
      setTimeLeft(remaining)
      setTotalTimeLeft(Math.max(0, totalDuration - elapsed - ((currentAd - 1) * adDuration)))
      
      if (elapsed >= adDuration) {
        if (currentAd >= adCount) {
          clearInterval(timerRef.current!)
          setIsComplete(true)
          setCanClose(true)
          console.log('✅ All ads complete!')
          return
        }
        
        setCurrentAd(prev => prev + 1)
        elapsed = 0
        loadAd(currentAd + 1)
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

      {/* Main Ad Content */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center bg-gray-900 relative overflow-hidden"
      >
        {!adLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-10">
            <div className="w-16 h-16 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
            <p className="text-gray-400 mt-4">Loading ad {currentAd}...</p>
          </div>
        )}

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