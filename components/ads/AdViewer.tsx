// components/ads/AdViewer.tsx
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

  // Load Adsterra ad - FIXED: Cleaner implementation
  useEffect(() => {
    if (!containerRef.current || scriptLoadedRef.current) return
    
    scriptLoadedRef.current = true
    const container = containerRef.current
    
    // Clear container
    container.innerHTML = ''
    
    // Create wrapper
    const wrapper = document.createElement('div')
    wrapper.className = 'adsterra-ad-wrapper w-full h-full flex items-center justify-center'
    wrapper.id = `adsterra-wrapper-${currentAd}`
    
    // Create container div for Adsterra
    const adDiv = document.createElement('div')
    adDiv.id = 'container-478289f3c17549c6c042b9e58c05b749'
    adDiv.className = 'adsterra-ad-container w-full max-w-3xl mx-auto'
    
    wrapper.appendChild(adDiv)
    container.appendChild(wrapper)
    
    // Store reference for cleanup
    adContainerRef.current = wrapper

    // Load script - only once
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

    // Cleanup function
    return () => {
      // Only cleanup if we're unmounting completely
      if (container) {
        const wrapper = container.querySelector('.adsterra-ad-wrapper')
        if (wrapper) {
          container.removeChild(wrapper)
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
        // Refresh ad container for new ad
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

  // NEW: Check auth before claiming reward
  const checkAuthAndClaim = async () => {
    setIsAuthChecking(true)
    
    try {
      // Check if user is still authenticated
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        console.log('🔴 User not authenticated, redirecting to login...')
        setShowWarning(true)
        setTimeout(() => {
          setShowWarning(false)
          if (onAuthRequired) {
            onAuthRequired()
          } else {
            router.push('/login?redirect=/dashboard/earn')
          }
        }, 1500)
        return
      }
      
      // User is authenticated, claim reward
      console.log('✅ User authenticated, claiming reward...')
      const fraudScore = {
        avgViewTime: totalDuration,
        tabSwitches: 0,
        isHeadlessBrowser: false,
        isProxy: false,
        fraudScore: 0.1
      }
      onComplete(reward, adTier, fraudScore)
      
    } catch (error) {
      console.error('❌ Auth check error:', error)
      if (onAuthRequired) {
        onAuthRequired()
      } else {
        router.push('/login?redirect=/dashboard/earn')
      }
    } finally {
      setIsAuthChecking(false)
    }
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
    <div className="fixed inset-0 z-[99999] bg-black flex flex-col ad-viewer-overlay">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-gray-800 ad-viewer-header">
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
          disabled={!canClose || isAuthChecking}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            canClose && !isAuthChecking
              ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 cursor-pointer' 
              : 'bg-gray-800/50 text-gray-600 cursor-not-allowed opacity-50'
          }`}
        >
          {isAuthChecking ? (
            <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
          ) : (
            <FaTimes className="text-lg" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden ad-viewer-content">
        {isComplete ? (
          <div className="text-center ad-viewer-complete">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">All Ads Complete!</h2>
            <p className="text-gray-400 text-lg mb-2">Click the green ✕ button to claim your reward</p>
            <div className="mt-4 inline-block bg-green-500/20 text-green-400 px-6 py-2 rounded-full text-sm font-medium">
              +{reward.toFixed(2)} SPY
            </div>
            {isAuthChecking && (
              <div className="mt-4 flex items-center justify-center gap-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
                <span className="text-sm">Verifying your account...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white">Ad {currentAd} of {adCount}</h2>
              <p className="text-gray-400 text-sm">{Math.ceil(timeLeft)} seconds remaining</p>
            </div>
            
            <div 
              ref={containerRef}
              className="ad-viewer-container w-full bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 min-h-[300px] md:min-h-[400px] flex items-center justify-center"
            >
              {/* Ad will be injected here */}
            </div>
          </div>
        )}

        {/* Countdown Circle */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <div className="relative w-14 h-14 md:w-16 md:h-16">
            <svg className="w-full h-full transform -rotate-90">
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
          <div className="max-w-4xl mx-auto">
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
      <div className="bg-black/90 border-t border-gray-800 px-4 py-2 flex justify-between items-center ad-viewer-footer">
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[99999] bg-red-500/95 rounded-xl px-6 py-4 max-w-sm text-center shadow-2xl">
          <div className="flex items-center justify-center mb-2">
            <FaExclamationTriangle className="text-white text-2xl" />
          </div>
          <p className="text-white font-medium">
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