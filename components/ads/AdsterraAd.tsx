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

  useEffect(() => {
    console.log('🎬 AdsterraAd mounted:', { userId, adType, minDuration })
    
    // For testing, just simulate an ad
    const simulateAd = () => {
      setIsLoading(false)
      setAdLoaded(true)
      
      // Display a test ad
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
            <div class="text-6xl mb-4">📺</div>
            <h3 class="text-white font-bold text-xl mb-2">Adsterra ${adType} Ad</h3>
            <p class="text-gray-400 text-sm">Watch for ${minDuration} seconds to earn rewards</p>
            <div class="mt-4 w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div id="ad-progress" class="h-full bg-accent-500 transition-all duration-1000" style="width: 0%"></div>
            </div>
            <p class="text-gray-500 text-xs mt-2">Simulated ad for testing</p>
          </div>
        `
      }
      
      startTracking()
    }
    
    // Start after a short delay
    setTimeout(simulateAd, 1000)
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [userId, adType, minDuration, onError])

  const startTracking = () => {
    console.log('⏱️ Starting Adsterra tracking for', minDuration, 'seconds')
    
    let elapsed = 0
    const interval = 1000
    
    // Update progress bar
    const progressBar = document.getElementById('ad-progress')
    
    timerRef.current = setInterval(() => {
      elapsed += interval
      
      // Update progress
      if (progressBar) {
        const progress = Math.min((elapsed / (minDuration * 1000)) * 100, 100)
        progressBar.style.width = `${progress}%`
      }
      
      console.log(`⏱️ Ad progress: ${elapsed}/${minDuration * 1000}ms`)
      
      if (elapsed >= minDuration * 1000) {
        console.log('✅ Ad complete!')
        clearInterval(timerRef.current!)
        
        // Calculate reward
        const reward = Math.round((0.15 * Math.min(minDuration / 30, 1.5)) * 100) / 100
        console.log('💰 Reward:', reward)
        
        onComplete(reward)
      }
    }, interval)
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center bg-gray-800/50"
    >
      {isLoading && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading Adsterra ad...</p>
        </div>
      )}
    </div>
  )
}