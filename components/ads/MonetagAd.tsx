'use client'

import { useEffect, useRef, useState } from 'react'

interface MonetagAdProps {
  onAdComplete?: (reward: number) => void
  onAdError?: (error: string) => void
  adType?: 'display' | 'popunder' | 'interstitial'
  userId?: string
}

export default function MonetagAd({ 
  onAdComplete, 
  onAdError, 
  adType = 'display',
  userId 
}: MonetagAdProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Register Monetag Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/monetag-sw.js')
        .then((registration) => {
          console.log('Monetag Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('Monetag Service Worker registration failed:', error)
          onAdError?.('Failed to load monetag ads')
        })
    }

    // Inject Monetag script for the ad
    const script = document.createElement('script')
    script.src = `https://3nbf4.com/act/${adType}.js?zoneId=11365022`
    script.async = true
    script.dataset.userId = userId || ''
    
    script.onload = () => {
      setIsLoading(false)
      console.log('Monetag ad loaded:', adType)
      
      // Start tracking ad view
      startAdTracking()
    }
    
    script.onerror = () => {
      setIsLoading(false)
      onAdError?.('Failed to load ad')
    }
    
    if (containerRef.current) {
      containerRef.current.appendChild(script)
    }

    return () => {
      // Cleanup
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (containerRef.current) {
        const scripts = containerRef.current.querySelectorAll('script')
        scripts.forEach(s => s.remove())
      }
    }
  }, [adType, userId, onAdError])

  const startAdTracking = () => {
    // Simulate ad viewing time based on ad type
    let duration = 0
    switch(adType) {
      case 'display': duration = 10000 // 10 seconds
        break
      case 'popunder': duration = 5000 // 5 seconds
        break
      case 'interstitial': duration = 15000 // 15 seconds
        break
      default: duration = 10000
    }

    // Track if user is still viewing the ad
    let viewTime = 0
    const interval = 1000 // Check every second
    
    timerRef.current = setInterval(() => {
      viewTime += interval
      
      // Check if user is still on page and ad is visible
      if (document.hidden) {
        // User switched tabs - pause tracking
        return
      }
      
      // Check if element is visible
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const isVisible = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth
        )
        
        if (!isVisible) {
          // Ad not visible - pause tracking
          return
        }
      }
      
      // Ad is being viewed
      if (viewTime >= duration) {
        // Ad complete
        clearInterval(timerRef.current!)
        setIsComplete(true)
        
        // Calculate reward (different for Monetag)
        const reward = calculateMonetagReward(adType, viewTime)
        onAdComplete?.(reward)
      }
    }, interval)
  }

  const calculateMonetagReward = (type: string, timeViewed: number): number => {
    // Monetag-specific reward calculation
    const baseRates = {
      'display': 0.08,
      'popunder': 0.06,
      'interstitial': 0.15
    }
    
    const baseRate = baseRates[type as keyof typeof baseRates] || 0.08
    const timeMultiplier = Math.min(timeViewed / 10000, 1.5) // Max 1.5x
    const reward = baseRate * timeMultiplier
    
    // Small random variation
    const variation = 0.8 + (Math.random() * 0.4)
    const finalReward = Math.round((reward * variation) * 100) / 100
    
    return Math.min(finalReward, 0.50) // Cap at 0.50 SPY
  }

  return (
    <div 
      ref={containerRef} 
      className="monetag-ad-container w-full h-full min-h-[250px] relative"
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <div className="w-8 h-8 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
        </div>
      )}
      {isComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 backdrop-blur-sm">
          <div className="text-green-400 font-medium">✓ Ad Complete!</div>
        </div>
      )}
    </div>
  )
}