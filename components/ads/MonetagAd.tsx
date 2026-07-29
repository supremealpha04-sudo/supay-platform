'use client'

import { useEffect, useRef, useState } from 'react'

interface MonetagAdProps {
  userId?: string
  adType?: string
  onAdComplete?: (reward: number) => void
  onAdError?: (error: string) => void
}

export default function MonetagAd({ 
  userId, 
  adType = 'display', 
  onAdComplete, 
  onAdError 
}: MonetagAdProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const viewTimeRef = useRef<number>(0)

  useEffect(() => {
    // Register Monetag Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/monetag-sw.js').catch(err => 
        console.error('Monetag SW registration failed:', err)
      )
    }

    // Inject Monetag script
    const script = document.createElement('script')
    script.src = `https://3nbf4.com/act/${adType}.js?zoneId=11365022`
    script.async = true
    script.dataset.userId = userId || ''
    
    script.onload = () => {
      setIsLoading(false)
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
      if (timerRef.current) clearTimeout(timerRef.current)
      if (containerRef.current) {
        const scripts = containerRef.current.querySelectorAll('script')
        scripts.forEach(s => s.remove())
      }
    }
  }, [adType, userId, onAdError])

  const startAdTracking = () => {
    const durations: Record<string, number> = {
      'display': 10000,
      'popunder': 5000,
      'interstitial': 15000
    }
    const duration = durations[adType] || 10000

    timerRef.current = setInterval(() => {
      viewTimeRef.current += 1000
      
      if (document.hidden) return
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const isVisible = rect.top >= 0 && rect.left >= 0 && 
          rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
        if (!isVisible) return
      }
      
      if (viewTimeRef.current >= duration) {
        clearInterval(timerRef.current!)
        setIsComplete(true)
        const baseRate = { 'display': 0.08, 'popunder': 0.06, 'interstitial': 0.15 }[adType] || 0.08
        const reward = Math.min(Math.round((baseRate * Math.min(viewTimeRef.current / 10000, 1.5)) * 100) / 100, 0.50)
        onAdComplete?.(reward)
      }
    }, 1000)
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-[250px] relative bg-gray-800/30">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50">
          <div className="w-10 h-10 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm mt-4">Loading Monetag ad...</p>
        </div>
      )}
      {isComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 backdrop-blur-sm">
          <div className="text-green-400 font-medium flex flex-col items-center gap-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Ad Complete!</span>
          </div>
        </div>
      )}
    </div>
  )
}