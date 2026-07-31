// components/ads/AdsterraAd.tsx
'use client'

import { useEffect, useRef } from 'react'

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
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    console.log(`🎬 Loading Adsterra ad ${adIndex}...`)

    if (containerRef.current) {
      // Clear container
      containerRef.current.innerHTML = ''
      
      // Create container for Adsterra
      const adContainer = document.createElement('div')
      adContainer.className = 'w-full h-full flex items-center justify-center'
      
      // Add Adsterra container div
      const containerDiv = document.createElement('div')
      containerDiv.id = 'container-478289f3c17549c6c042b9e58c05b749'
      containerDiv.className = 'w-full h-full min-h-[200px] flex items-center justify-center'
      
      adContainer.appendChild(containerDiv)
      containerRef.current.appendChild(adContainer)

      // Load Adsterra script
      const script = document.createElement('script')
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      script.src = 'https://pl30607520.effectivecpmnetwork.com/478289f3c17549c6c042b9e58c05b749/invoke.js'
      
      script.onload = () => {
        console.log(`✅ Adsterra ad ${adIndex} loaded`)
        onLoad()
      }
      
      script.onerror = () => {
        console.error(`❌ Failed to load ad ${adIndex}`)
        onError('Failed to load ad')
      }
      
      document.body.appendChild(script)
    }

    return () => {
      const script = document.querySelector('script[src*="pl30607520"]')
      if (script && script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [adIndex, onLoad, onError])

  return (
    <div ref={containerRef} className="w-full h-full min-h-[200px] flex items-center justify-center" />
  )
}