// components/ads/AdsterraAd.tsx
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
  const [adLoaded, setAdLoaded] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [timeLeft, setTimeLeft] = useState(minDuration)

  useEffect(() => {
    console.log('🎬 Loading Adsterra Native Banner ad...')

    // Your Adsterra ad tag
    const adTag = `
      <script async="async" data-cfasync="false" src="https://pl30607520.effectivecpmnetwork.com/478289f3c17549c6c042b9e58c05b749/invoke.js"></script>
      <div id="container-478289f3c17549c6c042b9e58c05b749"></div>
    `

    if (containerRef.current) {
      // Clear container
      containerRef.current.innerHTML = ''
      
      // Create a wrapper for the ad
      const wrapper = document.createElement('div')
      wrapper.className = 'adsterra-native-wrapper w-full h-full flex items-center justify-center'
      
      // Create container for the ad
      const adContainer = document.createElement('div')
      adContainer.id = 'adsterra-ad-container'
      adContainer.className = 'w-full h-full min-h-[250px]'
      
      // Inject the ad tag
      const script = document.createElement('script')
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      script.src = 'https://pl30607520.effectivecpmnetwork.com/478289f3c17549c6c042b9e58c05b749/invoke.js'
      
      script.onload = () => {
        console.log('✅ Adsterra ad loaded successfully')
        setIsLoading(false)
        setAdLoaded(true)
        
        // Start tracking after ad loads
        setTimeout(() => {
          startTracking()
        }, 2000) // Give ad 2 seconds to render
      }
      
      script.onerror = () => {
        console.error('❌ Failed to load Adsterra ad')
        setIsLoading(false)
        onError('Failed to load ad. Please try again.')
      }
      
      // Create container div for the ad
      const containerDiv = document.createElement('div')
      containerDiv.id = 'container-478289f3c17549c6c042b9e58c05b749'
      
      // Append everything
      adContainer.appendChild(script)
      adContainer.appendChild(containerDiv)
      wrapper.appendChild(adContainer)
      containerRef.current.appendChild(wrapper)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startTracking = () => {
    console.log('⏱️ Starting tracking for', minDuration, 'seconds')
    
    let elapsed = 0
    const interval = 1000
    
    timerRef.current = setInterval(() => {
      elapsed += interval
      const remaining = Math.max(0, minDuration - Math.floor(elapsed / 1000))
      setTimeLeft(remaining)
      
      // Check if user is still on page
      if (document.hidden) {
        console.log('⚠️ User switched tabs - pausing tracking')
        return
      }
      
      console.log(`⏱️ Ad progress: ${elapsed}/${minDuration * 1000}ms`)
      
      if (elapsed >= minDuration * 1000) {
        console.log('✅ Ad complete!')
        clearInterval(timerRef.current!)
        
        // Calculate reward
        const baseReward = adType === 'video' ? 0.50 : 0.15
        const durationBonus = Math.min(minDuration / 30, 1.5)
        const reward = Math.round((baseReward * durationBonus) * 100) / 100
        
        console.log('💰 Reward:', reward)
        onComplete(reward)
      }
    }, interval)
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Ad Container */}
      <div 
        ref={containerRef} 
        className="flex-1 flex items-center justify-center bg-gray-800/30 min-h-[300px]"
      >
        {isLoading && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading ad...</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {adLoaded && (
        <div className="border-t border-gray-700 p-3 bg-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Watching ad...</span>
            <span>{timeLeft}s remaining</span>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent-500 to-purple-500 transition-all duration-1000"
              style={{ 
                width: `${((minDuration - timeLeft) / minDuration) * 100}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}