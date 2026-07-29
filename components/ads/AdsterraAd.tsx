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
    // Adsterra integration
    const loadAd = async () => {
      try {
        const response = await fetch('/api/ads/adsterra/get-ad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, adType, format: 'html' })
        })
        
        const data = await response.json()
        
        if (data.success && data.adHtml) {
          if (containerRef.current) {
            containerRef.current.innerHTML = data.adHtml
            setIsLoading(false)
            startTracking()
          }
        } else {
          onError('Failed to load Adsterra ad')
        }
      } catch (error) {
        console.error('Adsterra error:', error)
        onError('Error loading Adsterra ad')
      }
    }

    loadAd()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [userId, adType, onError])

  const startTracking = () => {
    let elapsed = 0
    timerRef.current = setInterval(() => {
      elapsed += 1000
      if (elapsed >= minDuration * 1000) {
        clearInterval(timerRef.current!)
        const reward = Math.round((0.15 * Math.min(minDuration / 30, 1.5)) * 100) / 100
        onComplete(reward)
      }
    }, 1000)
  }

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gray-800/50">
      {isLoading && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading Adsterra ad...</p>
        </div>
      )}
    </div>
  )
}