'use client'

import { useEffect, useRef, useState } from 'react'

interface AdsterraAdProps {
  userId: string
  adType: string
  minDuration: number
  onComplete: (reward: number) => void
  onError: (error: string) => void
}

export default function AdsterraAd({
  userId,
  adType,
  minDuration,
  onComplete,
  onError
}: AdsterraAdProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Adsterra integration with API key
    // Since you have Adsterra API key, you can fetch ads from your backend
    const loadAd = async () => {
      try {
        const response = await fetch('/api/ads/adsterra/get-ad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            adType,
            format: 'html'
          })
        })
        
        const data = await response.json()
        
        if (data.success && data.adHtml) {
          // Inject Adsterra ad HTML
          if (containerRef.current) {
            containerRef.current.innerHTML = data.adHtml
            setIsLoading(false)
            
            // Start tracking
            startTracking()
          }
        } else {
          onError('Failed to load Adsterra ad')
        }
      } catch (error) {
        onError('Error loading Adsterra ad')
      }
    }

    loadAd()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [userId, adType, onError])

  const startTracking = () => {
    let elapsed = 0
    const interval = 1000
    
    timerRef.current = setInterval(() => {
      elapsed += interval
      
      if (elapsed >= minDuration * 1000) {
        clearInterval(timerRef.current!)
        // Calculate reward based on Adsterra eCPM
        const reward = calculateReward()
        onComplete(reward)
      }
    }, interval)
  }

  const calculateReward = (): number => {
    // Adsterra-specific reward based on their API data
    const baseReward = 0.15
    const durationBonus = Math.min(minDuration / 30, 1.5)
    const reward = baseReward * durationBonus
    return Math.round(reward * 100) / 100
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center"
    >
      {isLoading && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading ad...</p>
        </div>
      )}
    </div>
  )
}