// components/ads/AdsterraAd.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

interface AdsterraAdProps {
  userId: string
  adType: string
  adIndex: number
  onLoad: () => void
  onError: (error: string) => void
}

export default function AdsterraAd({
  userId,
  adType,
  adIndex,
  onLoad,
  onError
}: AdsterraAdProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log(`🎬 Loading Adsterra ad ${adIndex}...`)

    if (containerRef.current) {
      // Clear container
      containerRef.current.innerHTML = ''
      
      // Create ad wrapper
      const wrapper = document.createElement('div')
      wrapper.className = 'w-full h-full flex items-center justify-center bg-gray-900'
      
      // Adsterra Native Banner
      wrapper.innerHTML = `
        <div id="adsterra-wrapper-${adIndex}" class="w-full h-full flex items-center justify-center">
          <div id="container-478289f3c17549c6c042b9e58c05b749" class="w-full h-full"></div>
        </div>
      `
      
      containerRef.current.appendChild(wrapper)

      // Load Adsterra script
      const script = document.createElement('script')
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      script.src = 'https://pl30607520.effectivecpmnetwork.com/478289f3c17549c6c042b9e58c05b749/invoke.js'
      
      script.onload = () => {
        console.log(`✅ Adsterra ad ${adIndex} loaded`)
        setIsLoading(false)
        onLoad()
      }
      
      script.onerror = () => {
        console.error(`❌ Failed to load ad ${adIndex}`)
        setIsLoading(false)
        onError('Failed to load ad')
      }
      
      document.body.appendChild(script)
    }

    return () => {
      // Cleanup
      const script = document.querySelector(`script[src*="pl30607520"]`)
      if (script) script.remove()
    }
  }, [adIndex, onLoad, onError])

  return (
    <div ref={containerRef} className="w-full h-full">
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-12 h-12 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
          <p className="text-gray-400 mt-4 text-sm">Loading ad...</p>
        </div>
      )}
    </div>
  )
}